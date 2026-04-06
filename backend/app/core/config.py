from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ThreatLens"
    
    # Security / Auth settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    # Access token has short life for security (Defense in Depth). Limits window of exposure if intercepted.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    # Refresh token lasts longer and will be kept in an httpOnly cookie.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Environment config
    ENVIRONMENT: str = "development"
    OTX_API_KEY: str = ""
    ABUSEIPDB_API_KEY: str = ""
    VT_API_KEY: str = ""
    SHODAN_API_KEY: str | None = None
    
    # Notifications
    TELEGRAM_BOT_TOKEN: str | None = None
    TELEGRAM_CHAT_ID: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    ALERT_EMAIL_TO: str | None = None

    
    # CORS setup
    CORS_ORIGINS: str = ""
    
    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Database
    DATABASE_URL: str
    REDIS_URL: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
