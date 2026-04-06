import asyncio
import uuid
import random
from datetime import datetime
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.ioc import IOC, IOCType
from app.models.cve import CVE
from app.models.alert import AlertEvent, AlertRule, AlertStatus, RuleType
from app.models.user import User

async def seed_mock_data():
    async with AsyncSessionLocal() as db:
        # Check if we have any users
        res = await db.execute(select(User))
        user = res.scalars().first()
        user_id = user.id if user else None

        # Sample IOCs
        iocs = [
            IOC(id=uuid.uuid4(), value="192.168.1.100", type=IOCType.IP, source="MockInfection", threat_score=95.5, confidence="HIGH", first_seen=datetime.utcnow()),
            IOC(id=uuid.uuid4(), value="malicious-domain.com", type=IOCType.DOMAIN, source="MockInfection", threat_score=80.0, confidence="MEDIUM", first_seen=datetime.utcnow()),
            IOC(id=uuid.uuid4(), value="4a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d", type=IOCType.HASH_MD5, source="MockInfection", threat_score=60.0, confidence="LOW", first_seen=datetime.utcnow()),
        ]
        for ioc in iocs:
            db.add(ioc)

        # Sample CVEs
        cves = [
            CVE(cve_id="CVE-2024-12345", description="Critical Remote Code Execution in MockServer v2.4.0", cvss_v3_score=9.8, cvss_severity="CRITICAL", published_date=datetime.utcnow()),
            CVE(cve_id="CVE-2024-54321", description="Privilege Escalation in MockKernel leading to kernel panic", cvss_v3_score=8.1, cvss_severity="HIGH", published_date=datetime.utcnow()),
        ]
        for cve in cves:
            db.add(cve)

        # Sample Alert Rules
        rule_id = str(uuid.uuid4())
        rule = AlertRule(
            id=rule_id,
            name="Critical Severity Alert",
            owner_id=user_id,
            rule_type=RuleType.CVE_SEVERITY,
            conditions={"min_cvss": 9.0}
        )
        db.add(rule)
        await db.flush() 

        # Sample Alerts
        alerts = [
            AlertEvent(id=str(uuid.uuid4()), rule_id=rule.id, message="CVE-2024-12345 detected with critical severity", status=AlertStatus.NEW, triggered_at=datetime.utcnow()),
            AlertEvent(id=str(uuid.uuid4()), rule_id=rule.id, message="Anomalous IP 192.168.1.100 flagged as malicious", status=AlertStatus.NEW, triggered_at=datetime.utcnow()),
        ]
        for alert in alerts:
            db.add(alert)

        await db.commit()
        print("Mock data seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_mock_data())
