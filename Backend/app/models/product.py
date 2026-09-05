from sqlalchemy import Column, String, TIMESTAMP, Boolean, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from app.core.database import Base


class Product(Base):
    """
    Maps to the `products` table — a shared master catalog with no
    agent_id, unlike buyers/suppliers which are agent-owned. Every
    agent draws from and adds to the same product list (per project
    decision — flagged earlier as worth confirming, now proceeding on
    that basis).
    """

    __tablename__ = "products"

    product_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), nullable=False, server_default="Uncategorized")

    unit = Column(
        ENUM("kg", "bag", "crate", "dozen", "ton", "maund"),
        nullable=False,
        server_default="kg",
    )

    description = Column(String(255), nullable=True)
    active_status = Column(Boolean, nullable=False, server_default="1")

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    supplier_supplies = relationship("SupplierSupply", back_populates="product")

    def __repr__(self):
        return f"<Product product_id={self.product_id} name={self.name!r}>"