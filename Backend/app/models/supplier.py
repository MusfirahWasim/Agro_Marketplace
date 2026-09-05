from sqlalchemy import Column, String, DECIMAL, TIMESTAMP, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER
from app.core.database import Base


class Supplier(Base):
    """
    Maps to the `suppliers` table. Suppliers never log in — they're
    registered and managed entirely by the agent (agent_id), unlike
    v1's Party which suppliers directly owned via their own login.
    """

    __tablename__ = "suppliers"

    supplier_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

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

    agent = relationship("CommissionAgent", back_populates="suppliers")
    supplier_supplies = relationship("SupplierSupply", back_populates="supplier")

    # This supplier's own ledger account (accounts.supplier_id)
    account = relationship("Account", back_populates="supplier", uselist=False)

    def __repr__(self):
        return f"<Supplier supplier_id={self.supplier_id} name={self.name!r}>"