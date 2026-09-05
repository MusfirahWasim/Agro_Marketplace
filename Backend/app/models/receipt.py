from sqlalchemy import Column, String, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, BIGINT
from app.core.database import Base


class Receipt(Base):
    """
    Maps to the `receipts` table — 1:1 with a Payment (enforced by
    uq_receipt_payment), created internally by payment_service.py
    alongside the payment it belongs to. receipt_number is generated
    as f"RCPT-{receipt_id:06d}" after the row's PK is known (per
    project decision).
    """

    __tablename__ = "receipts"

    receipt_id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    receipt_number = Column(String(30), unique=True, nullable=False)

    payment_id = Column(
        BIGINT(unsigned=True),
        ForeignKey("payments.payment_id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
    )

    amount = Column(DECIMAL(12, 2), nullable=False)

    description = Column(String(255), nullable=True)

    issued_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    created_by = Column(
        INTEGER(unsigned=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )

    payment = relationship("Payment", back_populates="receipt")
    creator = relationship("User")

    def __repr__(self):
        return f"<Receipt receipt_id={self.receipt_id} receipt_number={self.receipt_number!r}>"