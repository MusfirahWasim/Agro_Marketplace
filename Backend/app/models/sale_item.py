from sqlalchemy import Column, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER
from app.core.database import Base


class SaleItem(Base):
    """
    Maps to the `sale_items` table — one line of a sale, tied to a
    single consignment. Replaces v1's single-item Order at the line
    level; rate_per_unit/total_amount are computed server-side from
    the referenced consignment's selling_price_per_unit, never trusted
    from the client (same rule v1 applied at the order level).

    Commission is calculated per sale_item (1:1 with `commissions`,
    enforced by a unique key there) — not per whole sale.
    """

    __tablename__ = "sale_items"

    sale_item_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    sale_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("sales.sale_id", ondelete="RESTRICT"),
        nullable=False,
    )
    consignment_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("consignments.consignment_id", ondelete="RESTRICT"),
        nullable=False,
    )

    quantity = Column(DECIMAL(12, 3), nullable=False)
    rate_per_unit = Column(DECIMAL(12, 2), nullable=False)
    total_amount = Column(DECIMAL(12, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
    consignment = relationship("Consignment", back_populates="sale_items")
    commission = relationship(
        "Commission",
        back_populates="sale_item",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<SaleItem sale_item_id={self.sale_item_id} sale_id={self.sale_id}>"