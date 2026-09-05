from sqlalchemy import Column, String, DECIMAL, TIMESTAMP, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER
from app.core.database import Base


class Buyer(Base):
    """
    Maps to the `buyers` table. Buyers never log in — they're
    registered and managed entirely by the agent (agent_id), unlike
    v1's Party which buyers directly owned via their own login.
    """

    __tablename__ = "buyers"

    buyer_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    agent_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("commission_agents.agent_id", ondelete="RESTRICT"),
        nullable=False,
    )

    name = Column(String(100), nullable=False)
    phone = Column(String(13), nullable=True)
    cnic = Column(String(15), nullable=True)
    email = Column(String(100), nullable=True)

    active_status = Column(Boolean, nullable=False, server_default="1")
    credit_limit = Column(DECIMAL(12, 2), nullable=False, server_default="0.00")

    billing_address = Column(String(150), nullable=True)
    shipping_address = Column(String(150), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    agent = relationship("CommissionAgent", back_populates="buyers")
    sales = relationship("Sale", back_populates="buyer")

    # This buyer's own ledger account (accounts.buyer_id)
    account = relationship("Account", back_populates="buyer", uselist=False)

    def __repr__(self):
        return f"<Buyer buyer_id={self.buyer_id} name={self.name!r}>"