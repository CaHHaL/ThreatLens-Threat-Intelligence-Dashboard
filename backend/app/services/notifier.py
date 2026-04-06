import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_telegram(message: str):
    """
    To setup Telegram:
    1. Search for @BotFather in Telegram
    2. Send /newbot, choose a name and username
    3. Copy the HTTP API Token to TELEGRAM_BOT_TOKEN in .env
    4. Search for your bot and send it a message
    5. Visit https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates to find your chat ID
    6. Copy the chat ID to TELEGRAM_CHAT_ID in .env
    """
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    chat_id = getattr(settings, "TELEGRAM_CHAT_ID", None)
    
    if not token or not chat_id:
        logger.warning("Telegram credentials not configured. Skipping notifying.")
        return
        
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
    try:
        response = await asyncio.to_thread(requests.post, url, json=payload)
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")

async def send_email(subject: str, body: str):
    user = getattr(settings, "SMTP_USER", None)
    password = getattr(settings, "SMTP_PASSWORD", None)
    host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
    port = getattr(settings, "SMTP_PORT", 587)
    to_email = getattr(settings, "ALERT_EMAIL_TO", user)
    
    if not user or not password or not to_email:
        logger.warning("Email credentials not configured. Skipping alerting via email.")
        return

    msg = MIMEMultipart()
    msg['From'] = user
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        def sync_send():
            with smtplib.SMTP(host, port) as server:
                server.starttls()
                server.login(user, password)
                server.send_message(msg)
        await asyncio.to_thread(sync_send)
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")
