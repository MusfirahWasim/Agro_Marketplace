from sqlalchemy import Column, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from sqlalchemy.orm import relationship
from app.core.database import Base


class Consignment(Base):
    """
    Maps to `supplier_agent_consignment` — the hand-off point where a
    supplier's stock is transferred to an agent's managed inventory.
    """

    __tablename__ = "supplier_agent_consignment"

    consigned_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    supply_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("supplies.supply_id"),
        nullable=False,
    )

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

    agent_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("parties.party_id"),
        nullable=False,
    )
    agent_type = Column(
        ENUM("CA"),
        nullable=False,
        server_default="CA",
    )

    payment_term = Column(
        ENUM("cash", "credit"),
        nullable=False,
        server_default="credit",
    )

    quantity_consigned = Column(INTEGER(unsigned=True), nullable=False)
    selling_price_per_unit = Column(DECIMAL(10, 2), nullable=False)
    commission_rate = Column(DECIMAL(5, 2), nullable=True)
    quantity_sold = Column(
        INTEGER(unsigned=True),
        nullable=False,
        server_default="0",
    )
    quantity_remaining = Column(INTEGER(unsigned=True), nullable=False)

    consigned_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
    )

    status = Column(
        ENUM("pending", "confirmed", "completed", "cancelled"),
        server_default="pending",
    )

    supply = relationship("Supply", backref="consignments")

    supplier = relationship(
        "Party",
        foreign_keys=[supplier_id],
        backref="consignments_as_supplier",
    )

    agent = relationship(
        "Party",
        foreign_keys=[agent_id],
        backref="consignments_as_agent",
    )

    def __repr__(self):
        return (
            f"<Consignment consigned_id={self.consigned_id} "
            f"status={self.status}>"
        )