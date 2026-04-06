import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def enrich_abuseipdb(ip: str) -> dict:
    if not settings.ABUSEIPDB_API_KEY:
        return {"error": "API key not configured."}
        
    url = "https://api.abuseipdb.com/api/v2/check"
    headers = {
        "Accept": "application/json",
        "Key": settings.ABUSEIPDB_API_KEY
    }
    params = {
        "ipAddress": ip,
        "maxAgeInDays": 90
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json().get("data", {})
                return {
                    "abuseConfidenceScore": data.get("abuseConfidenceScore", 0),
                    "totalReports": data.get("totalReports", 0),
                    "countryCode": data.get("countryCode"),
                    "isp": data.get("isp"),
                    "usageType": data.get("usageType"),
                    "lastReportedAt": data.get("lastReportedAt")
                }
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        logger.error(f"AbuseIPDB Enrichment Error for {ip}: {e}")
        return {"error": str(e)}
