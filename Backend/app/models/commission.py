from sqlalchemy import Column, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER
from app.core.database import Base


class Commission(Base):
    """
    Maps to the `commissions` table — one commission row per
    sale_item (1:1, enforced by uq_commission_sale_item), per the
    project's schema fix moving this off the whole-sale level.

    Created internally by commission_service.py, never via a direct
    create endpoint. payout_status (see schemas/commission.py) is
    computed by checking `transactions` for a matching entry against
    the agent's own account — not a column on this table.
    """

    __tablename__ = "commissions"

    commission_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    sale_item_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("sale_items.sale_item_id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
    )
    agent_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("commission_agents.agent_id", ondelete="RESTRICT"),
        nullable=False,
    )

    commission_rate = Column(DECIMAL(5, 2), nullable=False)
    commission_amount = Column(DECIMAL(12, 2), nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    sale_item = relationship("SaleItem", back_populates="commission")
    agent = relationship("CommissionAgent", back_populates="commissions")

    def __repr__(self):
        return (
            f"<Commission commission_id={self.commission_id} "
            f"sale_item_id={self.sale_item_id}>"
        )