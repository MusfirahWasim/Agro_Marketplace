from sqlalchemy import Column, String, DECIMAL, ForeignKey
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from sqlalchemy.orm import relationship
from app.core.database import Base


class Supply(Base):
    """Maps to `supplies` — a supplier's own inventory listing."""

    __tablename__ = "supplies"

    supply_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    supplier_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("parties.party_id"),
        nullable=False,
    )

    supplier_type = Column(
        ENUM("S"),
        nullable=False,
        server_default="S",
    )

    unit = Column(
        ENUM("kg", "bag", "crate", "dozen", "ton", "maund"),
        nullable=False,
        server_default="kg",
    )

    item_name = Column(String(50), nullable=False)
    category = Column(String(30), nullable=False, server_default="Uncategorized")
    current_stock = Column(INTEGER(unsigned=True), nullable=False)
    cost_per_unit = Column(DECIMAL(10, 2), nullable=False)
    description = Column(String(200), nullable=True)

    supplier = relationship(
        "Party",
        foreign_keys=[supplier_id],
        backref="supplies",
    )

    def __repr__(self):
        return f"<Supply supply_id={self.supply_id} item_name={self.item_name!r}>"