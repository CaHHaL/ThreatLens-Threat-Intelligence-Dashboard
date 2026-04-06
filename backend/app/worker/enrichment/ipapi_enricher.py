import httpx
import logging

logger = logging.getLogger(__name__)

async def enrich_ipapi(ip: str) -> dict:
    url = f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,lat,lon,isp,org,as"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "country": data.get("country"),
                        "countryCode": data.get("countryCode"),
                        "city": data.get("city"),
                        "lat": data.get("lat"),
                        "lon": data.get("lon"),
                        "isp": data.get("isp"),
                        "org": data.get("org"),
                        "asn": data.get("as")
                    }
                else:
                    return {"error": "Failed lookup"}
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        logger.error(f"IP-API Enrichment Error for {ip}: {e}")
        return {"error": str(e)}
