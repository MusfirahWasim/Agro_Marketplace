from sqlalchemy import Column, BigInteger, String, Enum, DECIMAL, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id            = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id       = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id    = Column(BigInteger, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    type          = Column(Enum("credit", "debit", "topup"), nullable=False)
    amount        = Column(DECIMAL(10, 2), nullable=False)
    balance_after = Column(DECIMAL(10, 2), nullable=False)
    note          = Column(String(255), nullable=True)
    created_at    = Column(DateTime, server_default=func.now())