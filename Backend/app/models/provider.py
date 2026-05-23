from sqlalchemy import Column, BigInteger, String, Text, Integer, DECIMAL, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Provider(Base):
    __tablename__ = "providers"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(Text)
    years_of_experience = Column(Integer) # tinyint in db mapped to Integer
    service_radius_km = Column(DECIMAL(6,2), default=10.00)
    lat = Column(DECIMAL(10,7))
    lng = Column(DECIMAL(10,7))
    is_featured = Column(Integer, default=0) # tinyint(1) usually maps to bool/int
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="provider_profile")
    services = relationship("ProviderService", back_populates="provider", cascade="all, delete-orphan")


class ProviderService(Base):
    __tablename__ = "provider_services"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    provider_id = Column(BigInteger, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10,2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    provider = relationship("Provider", back_populates="services")
    category = relationship("Category")