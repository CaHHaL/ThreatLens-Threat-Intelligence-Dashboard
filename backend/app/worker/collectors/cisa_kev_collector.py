import logging
import requests
from datetime import datetime
from celery import shared_task
from app.worker.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.cve import CVE
from app.models.ioc import IOC
from app.models.threat_feed import ThreatFeed
import asyncio

logger = logging.getLogger(__name__)

async def fetch_cisa_kev_async():
    logger.info("Starting CISA KEV fetch")
    url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch CISA KEV data: {e}")
        return

    vulnerabilities = data.get("vulnerabilities", [])
    if not vulnerabilities:
        logger.info("No KEV vulnerabilities found.")
        return

    async with AsyncSessionLocal() as db:
        for vuln in vulnerabilities:
            cve_id = vuln.get("cveID")
            if not cve_id:
                continue

            # Update existing CVE or create stub
            cve_obj = CVE(
                cve_id=cve_id,
                is_kev=True,
                description=vuln.get("shortDescription"),
                references=[{"vendorProject": vuln.get("vendorProject"), "product": vuln.get("product")}],
            )
            # Use merge to update or insert
            db.merge(cve_obj)

            # Insert as IOC
            from app.worker.normalizer import normalize_ioc, deduplicate_and_insert
            ioc_raw = {
                "cve_id": cve_id,
                "type": "CVE",
                "dateAdded": vuln.get("dateAdded"),
                "requiredAction": vuln.get("requiredAction"),
                "shortDescription": vuln.get("shortDescription")
            }
            norm_ioc = normalize_ioc(ioc_raw, "CISA_KEV")
            await deduplicate_and_insert(db, norm_ioc, "CISA_KEV")

        feed = await db.execute(ThreatFeed.__table__.select().where(ThreatFeed.name == "CISA_KEV"))
        if not feed.first():
            db.add(ThreatFeed(name="CISA_KEV", last_fetched=datetime.utcnow(), total_iocs=len(vulnerabilities), status="SUCCESS"))
            
        await db.commit()

    logger.info(f"Successfully processed {len(vulnerabilities)} CISA KEVs.")

@celery_app.task
def fetch_cisa_kev():
    asyncio.run(fetch_cisa_kev_async())
