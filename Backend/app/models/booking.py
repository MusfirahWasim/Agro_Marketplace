from sqlalchemy import Column, BigInteger, String, Text, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    provider_id = Column(BigInteger, ForeignKey("providers.id"), nullable=False)
    service_id = Column(BigInteger, ForeignKey("provider_services.id"), nullable=False)
    status = Column(Enum("requested", "accepted", "completed", "cancelled", "rejected"), default="requested")
    description = Column(Text)
    scheduled_at = Column(DateTime, nullable=False)
    address = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], backref="bookings")
    provider = relationship("Provider", foreign_keys=[provider_id], backref="bookings")
    service = relationship("ProviderService")