import httpx
import asyncio
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def enrich_virustotal(ioc: str, ioc_type: str, retries=1) -> dict:
    if not settings.VT_API_KEY:
        return {"error": "API key not configured."}
        
    headers = {"x-apikey": settings.VT_API_KEY}
    
    if ioc_type == "IP":
        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ioc}"
    elif ioc_type == "DOMAIN":
        url = f"https://www.virustotal.com/api/v3/domains/{ioc}"
    elif ioc_type in ["HASH_MD5", "HASH_SHA256"]:
        url = f"https://www.virustotal.com/api/v3/files/{ioc}"
    elif ioc_type == "URL":
        # URLs must be base64 encoded for VT v3 API
        import base64
        url_id = base64.urlsafe_b64encode(ioc.encode()).decode().strip("=")
        url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
    else:
        return {"error": "Unsupported type for VT."}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            
            if response.status_code == 429:
                if retries > 0:
                    logger.warning(f"VT Rate limit hit for {ioc}. Retrying in 15 seconds.")
                    await asyncio.sleep(15)
                    return await enrich_virustotal(ioc, ioc_type, retries=0)
                else:
                    return {"error": "Rate limit exceeded"}
                
            if response.status_code == 200:
                data = response.json().get("data", {}).get("attributes", {})
                stats = data.get("last_analysis_stats", {})
                
                results = data.get("last_analysis_results", {})
                detections = [
                    res["result"] for res in results.values()
                    if res.get("category") == "malicious"
                ]
                
                return {
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "undetected": stats.get("undetected", 0),
                    "total_engines": sum(stats.values()),
                    "detections": detections,
                    "tags": data.get("tags", [])
                }
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        logger.error(f"VirusTotal Enrichment Error for {ioc}: {e}")
        return {"error": str(e)}
