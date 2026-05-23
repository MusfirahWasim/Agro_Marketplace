from sqlalchemy import Column, BigInteger, String, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy import Numeric

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(180), nullable=True, unique=True)
    phone = Column(String(20), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("customer", "provider", "both"), nullable=False, default="customer")
    avatar_url = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    wallet_balance = Column(Numeric(10, 2), nullable=False, default=0)