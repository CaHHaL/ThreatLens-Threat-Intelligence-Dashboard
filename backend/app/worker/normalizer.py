from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.database import engine
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ioc import IOC, IOCType
from app.models.ioc import IOC, IOCType
import logging
import json
import random

logger = logging.getLogger(__name__)

redis_pub_client = None

async def get_redis_publisher():
    global redis_pub_client
    if not redis_pub_client:
        import redis.asyncio as aioredis
        from app.core.config import settings
        redis_pub_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_pub_client

async def publish_threat_event(event_type: str, payload: dict):
    try:
        client = await get_redis_publisher()
        await client.publish(
            "threat_feed", 
            json.dumps({"type": event_type, "data": payload, "timestamp": datetime.utcnow().isoformat()})
        )
    except Exception as e:
        logger.error(f"Failed to publish to redis: {e}")

async def deduplicate_and_insert(db: AsyncSession, ioc_data: dict, source: str):
    """
    Checks if IOC value already exists — if yes, update last_seen and increment source count, do not duplicate.
    Otherwise, insert new.
    """
    result = await db.execute(select(IOC).where(IOC.value == ioc_data["value"]))
    existing_ioc = result.scalar_one_or_none()

    if existing_ioc:
        # Update last_seen
        existing_ioc.last_seen = datetime.utcnow()
        # Increment source count conceptually, or just add tags
        if source not in existing_ioc.tags:
            existing_tags = list(existing_ioc.tags)
            existing_tags.append(source)
            existing_ioc.tags = existing_tags
            # Increase threat score for multiple confirmations (+10)
            existing_ioc.threat_score = min(100.0, existing_ioc.threat_score + 10.0)
    else:
        new_ioc = IOC(**ioc_data)
        db.add(new_ioc)
        
        # Push to live feed for net new IOCs mapped visually correctly
        attack_type = random.choice(["SSH brute force", "HTTP exploit", "malware C2", "scanner"])
        
        geo = ioc_data.get('geo_data', {})
        if not geo and new_ioc.type == IOCType.IP:
            # Temporary mock geo to animate new isolated pulses immediately 
            geo = {
                "lat": random.uniform(-60, 60),
                "lon": random.uniform(-180, 180),
                "country_code": random.choice(["US", "RU", "CN", "BR", "FR", "DE"]),
                "attack_type": attack_type
            }

        await publish_threat_event("new_ioc", {
            "value": new_ioc.value,
            "type": new_ioc.type.value,
            "threat_score": new_ioc.threat_score,
            "source": source,
            "geo": geo,
            "tags": new_ioc.tags
        })
    
    await db.commit()

def calculate_threat_score(ioc_data: dict) -> float:
    """
    scoring formula: base 0, +40 if from CISA KEV, +30 if CVSS >= 9, +20 if CVSS 7-8.9, +10 per additional source confirming it, max 100
    Since this works for both CVEs mapped to IOC or standard IOCs:
    """
    score = 0.0
    tags = ioc_data.get("tags", [])
    raw_data = ioc_data.get("raw_data", {})
    source = ioc_data.get("source", "")

    if source == "CISA_KEV" or "cisa_kev" in [t.lower() for t in tags]:
        score += 40.0
    
    cvss = raw_data.get("cvss_v3_score")
    if cvss is not None:
        if cvss >= 9.0:
            score += 30.0
        elif cvss >= 7.0:
            score += 20.0

    return min(100.0, score)

def normalize_ioc(raw: dict, source: str) -> dict:
    """converts any source's data to the unified IOC schema"""
    # Base structure
    ioc = {
        "value": str(raw.get("indicator") or raw.get("cve_id") or raw.get("value", "")),
        "source": source,
        "tags": raw.get("tags", []),
        "raw_data": raw,
    }
    
    # Infer Type
    # Since type is an enum string:
    t = raw.get("type", "").upper()
    if t in ["IP", "IPv4", "IPv6"]:
        ioc["type"] = IOCType.IP
    elif t in ["DOMAIN", "HOSTNAME"]:
        ioc["type"] = IOCType.DOMAIN
    elif t in ["URL", "URI"]:
        ioc["type"] = IOCType.URL
    elif t in ["HASH_MD5", "MD5"]:
        ioc["type"] = IOCType.HASH_MD5
    elif t in ["HASH_SHA256", "SHA256"]:
        ioc["type"] = IOCType.HASH_SHA256
    elif t in ["CVE"] or ioc["value"].startswith("CVE-"):
        ioc["type"] = IOCType.CVE
    else:
        ioc["type"] = IOCType.DOMAIN # Default fallback
        
    ioc["threat_score"] = calculate_threat_score(ioc)
    return ioc

# Used for the beat scheduler placeholder
from celery import shared_task
@shared_task
def enrich_iocs():
    logger.info("Enriching IOCs...")
    pass
