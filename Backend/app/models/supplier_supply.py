from sqlalchemy import Column, String, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from app.core.database import Base


class SupplierSupply(Base):
    """
    Maps to the `supplier_supplies` table — a supplier's intake of a
    given product. Replaces v1's Supply, but now references a shared
    Product via product_id instead of storing item_name/category/unit
    freehand on each row.
    """

    __tablename__ = "supplier_supplies"

    supplier_supply_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    supplier_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("suppliers.supplier_id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )
    product_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("products.product_id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    quantity_available = Column(DECIMAL(12, 3), nullable=False, server_default="0.000")
    cost_per_unit = Column(DECIMAL(12, 2), nullable=False)

    description = Column(String(255), nullable=True)

    status = Column(
        ENUM("available", "depleted", "cancelled"),
        nullable=False,
        server_default="available",
    )

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    supplier = relationship("Supplier", back_populates="supplier_supplies")
    product = relationship("Product", back_populates="supplier_supplies")
    consignments = relationship("Consignment", back_populates="supplier_supply")

    def __repr__(self):
        return (
            f"<SupplierSupply supplier_supply_id={self.supplier_supply_id} "
            f"product_id={self.product_id} status={self.status}>"
        )