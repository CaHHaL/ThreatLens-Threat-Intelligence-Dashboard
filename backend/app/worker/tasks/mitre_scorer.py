import logging
import asyncio
from datetime import datetime, timedelta
from app.core.database import AsyncSessionLocal
from app.models.mitre import Technique
from app.models.ioc import IOC
from app.models.cve import CVE
from sqlalchemy.future import select
from sqlalchemy import or_, text

logger = logging.getLogger(__name__)

# Basic mapping representation for CVE mapping calculation
CWE_TO_ATTACK = {
    "CWE-20": "T1190", # Exploit Public-Facing Application
    "CWE-79": "T1189", # Drive-by Compromise
    "CWE-89": "T1190", # Exploit Public-Facing Application
    "CWE-269": "T1068", # Exploitation for Privilege Escalation
    "CWE-306": "T1078", # Valid Accounts
    "CWE-352": "T1189", 
    "CWE-434": "T1505", # Server Software Component
    "CWE-798": "T1078", # Valid Accounts
    "CWE-287": "T1078",
}

async def run_mitre_scorer():
    logger.info("Running daily MITRE ATT&CK technique frequency scoring...")

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Technique))
        techniques = {t.id: t for t in res.scalars().all()}
        
        # Reset counts
        for t in techniques.values():
            t.frequency_score = 0
            t.linked_cve_count = 0
            
        # 1. Score OTX mapping from recent IOCs last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        res_iocs = await db.execute(select(IOC).where(IOC.last_seen >= thirty_days_ago))
        iocs = res_iocs.scalars().all()
        
        for ioc in iocs:
            for tag in ioc.tags:
                tag_upper = tag.upper()
                if tag_upper in techniques:
                    techniques[tag_upper].frequency_score += 1
                    
        # 2. Score CVE counts via CWE maps
        res_cves = await db.execute(select(CVE))
        cves = res_cves.scalars().all()
        
        for cve in cves:
            mapped_techniques = set()
            for cwe in cve.cwe_ids:
                mapped_t = CWE_TO_ATTACK.get(cwe)
                if mapped_t and mapped_t in techniques:
                    mapped_techniques.add(mapped_t)
            
            for t_id in mapped_techniques:
                techniques[t_id].linked_cve_count += 1
                
        # Scale the frequency score (since tags in our test dataset are tiny, it's literal counting right now)
        await db.commit()
    logger.info("MITRE Scorer finished configuring stats.")
    
from app.worker.celery_app import celery_app
@celery_app.task
def score_mitre_techniques():
    asyncio.run(run_mitre_scorer())
