import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def enrich_shodan(ip: str) -> dict:
    if not settings.SHODAN_API_KEY:
        return {"error": "API key not configured."}
        
    url = f"https://api.shodan.io/shodan/host/{ip}?key={settings.SHODAN_API_KEY}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 404:
                return {"error": "Not found in Shodan"}
            if response.status_code == 429: # Quota exceeded
                logger.warning("Shodan quota limit exceeded.")
                return {"error": "Quota exceeded"}
            if response.status_code == 200:
                data = response.json()
                return {
                    "open_ports": data.get("ports", []),
                    "hostnames": data.get("hostnames", []),
                    "org": data.get("org", ""),
                    "os": data.get("os", ""),
                    "vulns": data.get("vulns", []),
                    "last_update": data.get("last_update")
                }
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        logger.error(f"Shodan Enrichment Error for {ip}: {e}")
        return {"error": str(e)}
