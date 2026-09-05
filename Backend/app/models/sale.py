from sqlalchemy import Column, DECIMAL, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from app.core.database import Base


class Sale(Base):
    """
    Maps to the `sales` table — the sale header. Replaces v1's
    single-item Order; a sale can now contain multiple sale_items
    (potentially across different consignments/products).

    Unlike v1 (which always computed payment_status/total on read),
    v2 stores subtotal/commission_amount/total_amount/payment_status
    directly on this row — sale_service.py is responsible for keeping
    them in sync as sale_items and payments change.
    """

    __tablename__ = "sales"

    sale_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    agent_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("commission_agents.agent_id", ondelete="RESTRICT"),
        nullable=False,
    )
    buyer_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("buyers.buyer_id", ondelete="RESTRICT"),
        nullable=False,
    )

    sale_date = Column(TIMESTAMP, server_default=func.current_timestamp())

    payment_term = Column(ENUM("cash", "credit", "partial"), nullable=False)

    subtotal = Column(DECIMAL(12, 2), nullable=False, server_default="0.00")
    commission_amount = Column(DECIMAL(12, 2), nullable=False, server_default="0.00")
    total_amount = Column(DECIMAL(12, 2), nullable=False, server_default="0.00")

    payment_status = Column(
        ENUM("unpaid", "partial", "paid"),
        nullable=False,
        server_default="unpaid",
    )

    status = Column(
        ENUM("pending", "confirmed", "completed", "cancelled"),
        nullable=False,
        server_default="pending",
    )

    delivery_date = Column(TIMESTAMP, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    agent = relationship("CommissionAgent", back_populates="sales")
    buyer = relationship("Buyer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Sale sale_id={self.sale_id} status={self.status}>"