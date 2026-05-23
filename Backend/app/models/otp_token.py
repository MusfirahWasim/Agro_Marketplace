from sqlalchemy import Column, BigInteger, String, Enum, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class OTPToken(Base):
    __tablename__ = "otp_tokens"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    type = Column(Enum("phone_verify", "email_verify", "password_reset", "login"), nullable=False)
    token = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())