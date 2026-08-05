from sqlalchemy import Column, DECIMAL, String, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from sqlalchemy.orm import relationship
from app.core.database import Base


class Account(Base):
    """
    Maps to `accounts` — the double-entry ledger. Every payment, refund,
    and commission gets one row here per affected party, with a running
    balance. This is the single source of truth for "what does party X
    currently owe / get owed" — nothing else in the schema should be
    used to answer that question directly.
    """

    __tablename__ = "accounts"

    account_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    party_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("parties.party_id"),
        nullable=False,
    )

    party_type = Column(
        ENUM("S", "B", "CA"),
        nullable=False,
    )

    transaction_type = Column(
        ENUM("payment", "refund", "commission"),
        nullable=False,
    )

    description = Column(String(255), nullable=True)

    debit_amount = Column(DECIMAL(12, 2), server_default="0")
    credit_amount = Column(DECIMAL(12, 2), server_default="0")
    running_balance = Column(DECIMAL(12, 2), server_default="0")

    payment_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("payments.payment_id"),
        nullable=True,
    )

    order_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("orders.order_id"),
        nullable=True,
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
    )

    party = relationship(
        "Party",
        foreign_keys=[party_id],
        backref="ledger_entries",
    )

    payment = relationship(
        "Payment",
        backref="ledger_entries",
    )

    order = relationship(
        "Order",
        backref="ledger_entries",
    )

    def __repr__(self):
        return (
            f"<Account account_id={self.account_id} "
            f"transaction_type={self.transaction_type}>"
        )