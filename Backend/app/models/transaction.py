from sqlalchemy import Column, String, DECIMAL, TIMESTAMP, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, BIGINT, ENUM
from app.core.database import Base


class Transaction(Base):
    """
    Maps to the `transactions` table — the actual ledger (this is what
    v1 called Account/account.py). running_balance is deliberately not
    a column here — the schema's own comment says so explicitly;
    account_service.py computes it as a cumulative sum ordered by
    transaction_date/transaction_id per account.
    """

    __tablename__ = "transactions"

    transaction_id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    account_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("accounts.account_id", ondelete="RESTRICT"),
        nullable=False,
    )

    transaction_type = Column(
        ENUM(
            "opening_balance", "sale", "purchase", "payment",
            "refund", "commission", "adjustment",
        ),
        nullable=False,
    )

    description = Column(String(255), nullable=False)

    debit_amount = Column(DECIMAL(12, 2), nullable=False, server_default="0.00")
    credit_amount = Column(DECIMAL(12, 2), nullable=False, server_default="0.00")

    reference_type = Column(
        ENUM("sale", "payment", "refund", "commission", "manual"),
        nullable=True,
    )
    reference_id = Column(BIGINT(unsigned=True), nullable=True)

    transaction_date = Column(TIMESTAMP, server_default=func.current_timestamp())

    created_by = Column(
        INTEGER(unsigned=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )

    account = relationship("Account", back_populates="transactions")
    creator = relationship("User")

    __table_args__ = (
        CheckConstraint(
            "(debit_amount > 0 AND credit_amount = 0) OR "
            "(credit_amount > 0 AND debit_amount = 0) OR "
            "(debit_amount = 0 AND credit_amount = 0)",
            name="chk_transaction_amount",
        ),
    )

    def __repr__(self):
        return (
            f"<Transaction transaction_id={self.transaction_id} "
            f"type={self.transaction_type}>"
        )