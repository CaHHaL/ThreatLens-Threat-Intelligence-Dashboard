import asyncio
import json
from datetime import datetime
from app.core.config import settings
from .enrichment_router import detect_ioc_type
from .abuseipdb_enricher import enrich_abuseipdb
from .virustotal_enricher import enrich_virustotal
from .shodan_enricher import enrich_shodan
from .ipapi_enricher import enrich_ipapi
import redis.asyncio as aioredis 

# Maintain solitary connected interface inside parallel logic namespace
redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

def determine_verdict(abuse_data, vt_data):
    malicious_score = 0
    if abuse_data and not abuse_data.get("error"):
        if abuse_data.get("abuseConfidenceScore", 0) > 80:
            malicious_score += 2
        elif abuse_data.get("abuseConfidenceScore", 0) > 40:
            malicious_score += 1
            
    if vt_data and not vt_data.get("error"):
        if vt_data.get("malicious", 0) > 3:
            malicious_score += 2
        elif vt_data.get("malicious", 0) > 0 or vt_data.get("suspicious", 0) > 0:
            malicious_score += 1

    if malicious_score >= 2:
        return "MALICIOUS", "Highly confident indicator of compromise detected."
    elif malicious_score == 1:
        return "SUSPICIOUS", "Indicator shows suspicious activity but requires investigation."
    return "CLEAN", "No significant threat intelligence found for indicator."

async def run_parallel_enrichment(value: str) -> dict:
    """Takes an IOC value, checks cache, orchestrates parallel resolution."""
    # Check cache first
    cache_key = f"enrichment:{value}"
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass # If Redis fails, gracefully degrade rather than crashing

    ioc_type = detect_ioc_type(value)
    
    abuse_task, vt_task, shodan_task, geo_task = None, None, None, None
    
    if ioc_type == "IP":
        abuse_task = enrich_abuseipdb(value)
        vt_task = enrich_virustotal(value, ioc_type)
        shodan_task = enrich_shodan(value)
        geo_task = enrich_ipapi(value)
    elif ioc_type in ["DOMAIN", "URL", "HASH_MD5", "HASH_SHA256"]:
        vt_task = enrich_virustotal(value, ioc_type)
        
    # Execute actively configured tasks in parallel structure guaranteeing overall ceiling < 15 seconds
    tasks = [
        abuse_task if abuse_task else asyncio.sleep(0),
        vt_task if vt_task else asyncio.sleep(0),
        shodan_task if shodan_task else asyncio.sleep(0),
        geo_task if geo_task else asyncio.sleep(0)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Check and assign. If exception natively surfaced, map it to dictionary error string safely.
    def safe_unwrap(task_result):
        if isinstance(task_result, Exception):
            return {"error": "Task crashed."}
        return task_result

    abuse_data = safe_unwrap(results[0]) if abuse_task else None
    vt_data = safe_unwrap(results[1]) if vt_task else None
    shodan_data = safe_unwrap(results[2]) if shodan_task else None
    geo_data = safe_unwrap(results[3]) if geo_task else None

    verdict, summary = determine_verdict(abuse_data, vt_data)
    
    result = {
        "ioc_value": value,
        "ioc_type": ioc_type,
        "enriched_at": datetime.utcnow().isoformat(),
        "abuse_data": abuse_data,
        "vt_data": vt_data,
        "shodan_data": shodan_data,
        "geo_data": geo_data,
        "overall_verdict": verdict,
        "threat_summary": summary
    }

    # Cache for 1 hour
    try:
        await redis_client.setex(cache_key, 3600, json.dumps(result))
    except:
        pass # Ignore cache save miss 
        
    return result
