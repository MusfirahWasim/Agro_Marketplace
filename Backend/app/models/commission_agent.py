from sqlalchemy import Column, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER
from app.core.database import Base


class CommissionAgent(Base):
    """
    Maps to the `commission_agents` table — the agent-specific profile
    linked 1:1 to a `users` row (role='COMMISSION_AGENT'). Everything
    login/identity-related (name, email, active_status) stays on User;
    this table only holds what's specific to being an agent.
    """

    __tablename__ = "commission_agents"

    agent_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    user_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("users.user_id", ondelete="RESTRICT", onupdate="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Default commission rate applied to a sale_item's commission
    # unless a consignment overrides it (see ConsignmentCreate.commission_rate)
    commission_rate = Column(DECIMAL(5, 2), nullable=False, server_default="0.00")

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    user = relationship("User", back_populates="commission_agent")

    # Everything this agent manages
    buyers = relationship("Buyer", back_populates="agent")
    suppliers = relationship("Supplier", back_populates="agent")
    consignments = relationship("Consignment", back_populates="agent")
    sales = relationship("Sale", back_populates="agent")
    commissions = relationship("Commission", back_populates="agent")
    payments = relationship("Payment", back_populates="agent")

    # This agent's own ledger account (accounts.agent_id) — see
    # account.py's open question on when this row gets created
    account = relationship(
        "Account",
        back_populates="agent",
        uselist=False,
    )

    def __repr__(self):
        return f"<CommissionAgent agent_id={self.agent_id} user_id={self.user_id}>"