from sqlalchemy import Column, DECIMAL, String, Date, ForeignKey
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from sqlalchemy.orm import relationship
from app.core.database import Base


class Payment(Base):
    """
    Maps to `payments`. Covers all three payment flows through a single
    payer/payee pair: buyer-to-agent, agent-to-supplier settlements, and
    refunds — the direction is determined by payer_type/payee_type, not
    by a separate table per flow.
    """

    __tablename__ = "payments"

    payment_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    payer_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("parties.party_id"),
        nullable=False,
    )
    payer_type = Column(ENUM("S", "B", "CA"), nullable=False)

    payee_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("parties.party_id"),
        nullable=False,
    )
    payee_type = Column(ENUM("S", "B", "CA"), nullable=False)

    payment_method = Column(ENUM("cash", "card", "other"), nullable=False)

    order_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("orders.order_id"),
        nullable=True,
    )

    amount_paid = Column(DECIMAL(12, 2), nullable=False)
    transaction_reference = Column(String(100), nullable=True)

    payment_date = Column(Date, nullable=False)

    payer = relationship(
        "Party",
        foreign_keys=[payer_id],
        backref="payments_made",
    )

    payee = relationship(
        "Party",
        foreign_keys=[payee_id],
        backref="payments_received",
    )

    order = relationship("Order", backref="payments")

    def __repr__(self):
        return f"<Payment payment_id={self.payment_id} amount_paid={self.amount_paid}>"