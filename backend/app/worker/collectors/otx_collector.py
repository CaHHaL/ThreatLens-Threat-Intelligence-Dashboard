import logging
import requests
from datetime import datetime, timedelta
from celery import shared_task
from app.worker.celery_app import celery_app
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.threat_feed import ThreatFeed
import asyncio

logger = logging.getLogger(__name__)

async def fetch_otx_pulses_async():
    otx_key = settings.OTX_API_KEY
    if not otx_key:
        logger.warning("OTX API Key not configured. Skipping execution.")
        return

    logger.info("Starting AlienVault OTX fetch")
    # Retrieve modified pulses from last 24h
    since_date = (datetime.utcnow() - timedelta(days=1)).isoformat()
    url = f"https://otx.alienvault.com/api/v1/pulses/subscribed?modified_since={since_date}"
    headers = {
        "X-OTX-API-KEY": otx_key
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch OTX data: {e}")
        return

    pulses = data.get("results", [])
    total_indicators = 0

    async with AsyncSessionLocal() as db:
        from app.worker.normalizer import normalize_ioc, deduplicate_and_insert
        for pulse in pulses:
            indicators = pulse.get("indicators", [])
            for ind in indicators:
                ioc_raw = {
                    "value": ind.get("indicator"),
                    "type": ind.get("type"),
                    "pulse_name": pulse.get("name"),
                    "description": ind.get("description", "")
                }
                
                norm_ioc = normalize_ioc(ioc_raw, "OTX")
                await deduplicate_and_insert(db, norm_ioc, "OTX")
                total_indicators += 1

        feed = await db.execute(ThreatFeed.__table__.select().where(ThreatFeed.name == "OTX"))
        if not feed.first():
            db.add(ThreatFeed(name="OTX", last_fetched=datetime.utcnow(), total_iocs=total_indicators, status="SUCCESS"))

        await db.commit()

    logger.info(f"Successfully processed {total_indicators} OTX indicators over {len(pulses)} pulses.")

@celery_app.task
def fetch_otx_pulses():
    asyncio.run(fetch_otx_pulses_async())
