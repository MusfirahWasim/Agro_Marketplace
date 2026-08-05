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

    # Used by utils/otp.py for the forgot-password flow (SMS OTP)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # Used by utils/otp.py for the forgot-password flow (email OTP) and
    # by utils/notifications.py for settlement/order email alerts
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Used by services/ai_service.py for demand forecasting, price
    # recommendations, credit risk analysis, and business insights
    AI_SERVICE_URL: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # Default commission rate (%) applied when a consignment doesn't
    # specify its own — used by services/commission_service.py
    DEFAULT_COMMISSION_RATE: float = 5.0

    # Low-stock threshold (in base units) that triggers the supplier
    # low-stock alert seen on SupplierDashboard — used by supply_service.py
    LOW_STOCK_THRESHOLD: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()