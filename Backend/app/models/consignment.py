from sqlalchemy import Column, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from app.core.database import Base


class Consignment(Base):
    """
    Maps to the `consignments` table — stock a supplier has handed to
    the agent for selling, at an agent-set price and commission rate.
    quantity_remaining is NOT a column here (derive, don't store —
    same principle used throughout v2): compute as
    quantity_consigned - quantity_sold in the service layer.
    """

    __tablename__ = "consignments"

    consignment_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    supplier_supply_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("supplier_supplies.supplier_supply_id", ondelete="RESTRICT"),
        nullable=False,
    )
    supplier_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("suppliers.supplier_id", ondelete="RESTRICT"),
        nullable=False,
    )
    agent_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("commission_agents.agent_id", ondelete="RESTRICT"),
        nullable=False,
    )

    quantity_consigned = Column(DECIMAL(12, 3), nullable=False)
    quantity_sold = Column(DECIMAL(12, 3), nullable=False, server_default="0.000")

    selling_price_per_unit = Column(DECIMAL(12, 2), nullable=False)
    commission_rate = Column(DECIMAL(5, 2), nullable=False, server_default="0.00")

    payment_term = Column(ENUM("cash", "credit"), nullable=False, server_default="credit")

    status = Column(
        ENUM("pending", "confirmed", "completed", "cancelled"),
        nullable=False,
        server_default="pending",
    )

    consigned_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    supplier_supply = relationship("SupplierSupply", back_populates="consignments")
    supplier = relationship("Supplier")
    agent = relationship("CommissionAgent", back_populates="consignments")
    sale_items = relationship("SaleItem", back_populates="consignment")

    def __repr__(self):
        return (
            f"<Consignment consignment_id={self.consignment_id} "
            f"status={self.status}>"
        )