from sqlalchemy import Column, String, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, BIGINT, ENUM
from app.core.database import Base


class Payment(Base):
    """
    Maps to the `payments` table. Unlike v1's Payment (generic
    payer/payee pair), this ties to a single account_id — direction
    is implied by whether that account belongs to a buyer or a
    supplier, not stored explicitly here. agent_id records who
    physically handled it; created_by records who logged it in the
    system (normally the same agent).
    """

    __tablename__ = "payments"

    payment_id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    account_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("accounts.account_id", ondelete="RESTRICT"),
        nullable=False,
    )
    agent_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("commission_agents.agent_id", ondelete="RESTRICT"),
        nullable=False,
    )

    amount_paid = Column(DECIMAL(12, 2), nullable=False)

    payment_method = Column(
        ENUM("cash", "bank_transfer", "card", "other"),
        nullable=False,
        server_default="cash",
    )

    transaction_reference = Column(String(100), nullable=True)

    payment_date = Column(TIMESTAMP, server_default=func.current_timestamp())

    notes = Column(String(255), nullable=True)

    created_by = Column(
        INTEGER(unsigned=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )

    account = relationship("Account")
    agent = relationship("CommissionAgent", back_populates="payments")
    creator = relationship("User")
    receipt = relationship(
        "Receipt",
        back_populates="payment",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Payment payment_id={self.payment_id} amount_paid={self.amount_paid}>"