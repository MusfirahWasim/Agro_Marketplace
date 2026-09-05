from sqlalchemy import Column, DECIMAL, TIMESTAMP, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER
from app.core.database import Base


class Account(Base):
    """
    Maps to the `accounts` table — a thin header row, one per buyer,
    supplier, OR agent (exactly one of the three FKs is set; enforced
    at the DB level by chk_account_owner, mirrored here for ORM-level
    clarity/validation).

    current_balance is NOT a column — account_service.py computes it
    as opening_balance plus the net of this account's `transactions`
    rows.
    """

    __tablename__ = "accounts"

    account_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    buyer_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("buyers.buyer_id", ondelete="RESTRICT"),
        unique=True,
        nullable=True,
    )
    supplier_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("suppliers.supplier_id", ondelete="RESTRICT"),
        unique=True,
        nullable=True,
    )
    agent_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("commission_agents.agent_id", ondelete="RESTRICT"),
        unique=True,
        nullable=True,
    )

    opening_balance = Column(DECIMAL(12, 2), nullable=False, server_default="0.00")

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    buyer = relationship("Buyer", back_populates="account")
    supplier = relationship("Supplier", back_populates="account")
    agent = relationship("CommissionAgent", back_populates="account")
    transactions = relationship("Transaction", back_populates="account")

    __table_args__ = (
        CheckConstraint(
            "(buyer_id IS NOT NULL AND supplier_id IS NULL AND agent_id IS NULL) OR "
            "(buyer_id IS NULL AND supplier_id IS NOT NULL AND agent_id IS NULL) OR "
            "(buyer_id IS NULL AND supplier_id IS NULL AND agent_id IS NOT NULL)",
            name="chk_account_owner",
        ),
    )

    def __repr__(self):
        return f"<Account account_id={self.account_id}>"