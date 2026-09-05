from pydantic_settings import BaseSettings
from typing import Optional
from urllib.parse import quote_plus

class Settings(BaseSettings):
    APP_NAME: str = "AISAMMS"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DB_HOST: str
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    REDIS_URL: Optional[str] = None

    @property
    def DATABASE_URL(self) -> str:
        password = quote_plus(self.DB_PASSWORD)

        return (
        f"mysql+aiomysql://{self.DB_USER}:{password}"
        f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # v1 used these for OTP-based forgot-password (utils/otp.py, now
    # dropped along with otp_token.py). Left here since forgot-password
    # in v2 has no defined mechanism yet (see schemas/auth.py) — if v2
    # ends up using an emailed reset link instead of OTP, SMTP_* below
    # still applies; TWILIO_* would become genuinely unused.
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # SMTP_* also used by utils/notifications.py in v1 for order/
    # settlement email alerts — same open question as above applies to
    # whether v2 keeps any email-alert feature at all.
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Used by services/ai_service.py for demand forecasting, price
    # recommendations, credit risk analysis, and business insights
    AI_SERVICE_URL: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # Fallback commission rate (%) — now only relevant if an agent's
    # own commission_agents.commission_rate is itself unset/zero and a
    # consignment also doesn't override it. Worth revisiting whether
    # this app-level default is still needed now that v2 has a
    # per-agent default (v1 had no per-agent equivalent).
    DEFAULT_COMMISSION_RATE: float = 5.0

    # Low-stock threshold (in base units) for supplier_supplies —
    # surfaced on AgentInventory.jsx / AgentSuppliers.jsx (v1's
    # SupplierDashboard doesn't exist in v2) — used by supply_service.py
    LOW_STOCK_THRESHOLD: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()