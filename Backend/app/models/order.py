from sqlalchemy import Column, DECIMAL, TIMESTAMP, ForeignKey, ForeignKeyConstraint, func
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    """
    Maps to `orders`. Every order references a `consigned_id`, never a
    product directly — that's what makes an order traceable back to a
    specific supplier through the consignment.
    """

    __tablename__ = "orders"
    __table_args__ = (
        ForeignKeyConstraint(
            ["buyer_id", "buyer_type"],
            ["parties.party_id", "parties.party_type"],
        ),
    )

    order_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    buyer_id = Column(INTEGER(unsigned=True), nullable=False)
    buyer_type = Column(ENUM("B"), nullable=False, server_default="B")

    consigned_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("supplier_agent_consignment.consigned_id"),
        nullable=False,
    )

    quantity_ordered = Column(INTEGER(unsigned=True), nullable=False)
    rate_per_unit = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(12, 2), nullable=False)

    payment_term = Column(ENUM("cash", "credit"), nullable=False)
    status = Column(
        ENUM("pending", "confirmed", "completed", "cancelled"),
        server_default="pending",
    )

    order_date = Column(TIMESTAMP, server_default=func.current_timestamp())
    delivery_date = Column(TIMESTAMP, nullable=True)

    buyer = relationship(
        "Party",
        foreign_keys=[buyer_id, buyer_type],
        backref="orders",
    )
    consignment = relationship("Consignment", backref="orders")

    def __repr__(self):
        return f"<Order order_id={self.order_id} status={self.status}>"
