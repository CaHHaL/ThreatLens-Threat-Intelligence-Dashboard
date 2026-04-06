import logging
import requests
from datetime import datetime, timedelta
from celery import shared_task
from app.worker.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.cve import CVE
from app.models.ioc import IOC, IOCType
from app.models.threat_feed import ThreatFeed
import asyncio

logger = logging.getLogger(__name__)

async def fetch_nvd_cves_async():
    logger.info("Starting NVD CVE fetch")
    start_date = datetime.utcnow() - timedelta(days=7)
    pub_start_date = start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    pub_end_date = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")

    url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    params = {
        "pubStartDate": pub_start_date,
        "pubEndDate": pub_end_date,
        "resultsPerPage": 2000,
        "startIndex": 0
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch NVD data: {e}")
        return

    cves = data.get("vulnerabilities", [])
    if not cves:
        logger.info("No new CVEs found in NVD.")
        return

    async with AsyncSessionLocal() as db:
        for item in cves:
            cve_data = item.get("cve", {})
            cve_id = cve_data.get("id")
            if not cve_id:
                continue

            # Extract metrics
            metrics = cve_data.get("metrics", {})
            cvss_v3 = metrics.get("cvssMetricV31", metrics.get("cvssMetricV30", []))
            
            cvss_score = None
            cvss_severity = None
            if cvss_v3:
                cvss_data = cvss_v3[0].get("cvssData", {})
                cvss_score = cvss_data.get("baseScore")
                cvss_severity = cvss_data.get("baseSeverity")

            # Extract descriptions
            descriptions = cve_data.get("descriptions", [])
            desc_en = next((d.get("value") for d in descriptions if d.get("lang") == "en"), "")

            # Weaknesses (CWE)
            cwes = []
            for w in cve_data.get("weaknesses", []):
                for desc in w.get("description", []):
                    if desc.get("value", "").startswith("CWE-"):
                        cwes.append(desc.get("value"))

            # Save CVE
            new_cve = CVE(
                cve_id=cve_id,
                description=desc_en,
                cvss_v3_score=cvss_score,
                cvss_severity=cvss_severity,
                published_date=datetime.strptime(cve_data.get("published"), "%Y-%m-%dT%H:%M:%S.%f") if cve_data.get("published") else None,
                cwe_ids=cwes,
            )
            
            db.merge(new_cve)
            
            # Also create an IOC record for this CVE
            from app.worker.normalizer import normalize_ioc, deduplicate_and_insert
            ioc_raw = {
                "cve_id": cve_id,
                "type": "CVE",
                "cvss_v3_score": cvss_score,
                "description": desc_en
            }
            norm_ioc = normalize_ioc(ioc_raw, "NVD")
            await deduplicate_and_insert(db, norm_ioc, "NVD")

        # Update ThreatFeed status
        feed = await db.execute(ThreatFeed.__table__.select().where(ThreatFeed.name == "NVD"))
        if not feed.first():
            db.add(ThreatFeed(name="NVD", last_fetched=datetime.utcnow(), total_iocs=len(cves), status="SUCCESS"))
        
        await db.commit()
    logger.info(f"Successfully processed {len(cves)} NVD CVEs.")

@celery_app.task
def fetch_nvd_cves():
    asyncio.run(fetch_nvd_cves_async())
