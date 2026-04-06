import logging
from datetime import datetime, timedelta
import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.alert import AlertRule, AlertEvent, RuleType
from app.models.ioc import IOC
from app.models.cve import CVE
from app.services.notifier import send_telegram, send_email
import redis.asyncio as aioredis
from app.core.config import settings
from app.worker.normalizer import publish_threat_event

logger = logging.getLogger(__name__)

async def get_redis():
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)

async def trigger_alert(db, rule: AlertRule, message: str, ioc_id: str = None, cve_id: str = None):
    r = await get_redis()
    key = f"alert_cooldown:{rule.id}"
    if await r.get(key):
        return

    event = AlertEvent(
        rule_id=rule.id,
        message=message,
        ioc_id=ioc_id,
        cve_id=cve_id
    )
    db.add(event)
    await db.commit()

    await r.setex(key, rule.cooldown_minutes * 60, "active")

    notify_text = f"🚨 ThreatLens Alert: {rule.name}\n{message}\nSeverity: CRITICAL"
    
    if rule.notify_telegram:
        asyncio.create_task(send_telegram(notify_text))
    if rule.notify_email:
        asyncio.create_task(send_email(f"ThreatLens Alert - {rule.name}", notify_text))
        
    await publish_threat_event("new_alert", {
        "rule_name": rule.name,
        "message": message,
        "ioc_id": ioc_id,
        "cve_id": cve_id
    })

async def evaluate_alerts():
    logger.info("Evaluating active alert rules...")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(AlertRule).where(AlertRule.is_active == True))
        rules = res.scalars().all()
        if not rules:
            return

        time_window = datetime.utcnow() - timedelta(minutes=15)
        
        res_iocs = await db.execute(select(IOC).where(IOC.created_at >= time_window))
        new_iocs = res_iocs.scalars().all()
        
        res_cves = await db.execute(select(CVE).where(CVE.created_at >= time_window))
        new_cves = res_cves.scalars().all()

        for rule in rules:
            conds = rule.conditions
            
            if rule.rule_type == RuleType.CVE_SEVERITY:
                min_cvss = conds.get("min_cvss", 0)
                products = conds.get("products", [])
                for cve in new_cves:
                    if cve.cvss_v3_score and cve.cvss_v3_score >= min_cvss:
                        if not products or any(p.lower() in str(cve.affected_products).lower() for p in products):
                            await trigger_alert(db, rule, f"CVE {cve.cve_id} detected with CVSS {cve.cvss_v3_score}", cve_id=cve.cve_id)

            elif rule.rule_type == RuleType.IP_ABUSE_SCORE:
                min_score = conds.get("min_score", 0)
                countries = conds.get("country_codes", [])
                for ioc in new_iocs:
                    if ioc.type == "IP" and ioc.threat_score >= min_score:
                        geo = ioc.raw_data.get("geo", {}) if isinstance(ioc.raw_data, dict) else {}
                        if not countries or geo.get("country_code") in countries:
                            await trigger_alert(db, rule, f"Malicious IP {ioc.value} detected with score {ioc.threat_score}", ioc_id=ioc.id)

            elif rule.rule_type == RuleType.KEYWORD_MATCH:
                keywords = [k.lower() for k in conds.get("keywords", [])]
                if not keywords: continue
                for cve in new_cves:
                    desc = str(cve.description).lower()
                    if any(k in desc for k in keywords):
                        await trigger_alert(db, rule, f"Keyword match in CVE {cve.cve_id}", cve_id=cve.cve_id)

            elif rule.rule_type == RuleType.KEV_ADDED:
                for cve in new_cves:
                    if getattr(cve, "is_kev", False):
                         await trigger_alert(db, rule, f"CISA KEV Addition: {cve.cve_id}", cve_id=cve.cve_id)
                         
            elif rule.rule_type == RuleType.TTP_DETECTED:
                for ioc in new_iocs:
                    if any(t.startswith("T") for t in ioc.tags):
                        await trigger_alert(db, rule, f"TTP indicator identified in {ioc.value}", ioc_id=ioc.id)

from app.worker.celery_app import celery_app
@celery_app.task
def run_alert_evaluation():
    asyncio.run(evaluate_alerts())
