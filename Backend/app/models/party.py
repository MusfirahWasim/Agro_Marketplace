from sqlalchemy import Column, String, DECIMAL, TIMESTAMP, Boolean, func
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from app.core.database import Base


class Party(Base):
    """
    Maps to the `parties` table — the single table shared by all four
    roles (Supplier, Buyer, Commission Agent, Admin), distinguished by
    `party_type`. Primary key is composite: (party_id, party_type).
    """

    __tablename__ = "parties"

    party_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    party_type = Column(ENUM("S", "B", "CA", "A"), primary_key=True)
    # S = Supplier, B = Buyer, CA = Commission Agent, A = Admin

    name = Column(String(50), nullable=False)
    phone = Column(String(13), nullable=True)
    cnic = Column(String(15), nullable=True)
    email = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=True)

    active_status = Column(Boolean, nullable=False, server_default="1")
    credit_limit = Column(DECIMAL(12, 2), nullable=False, server_default="0")

    billing_address = Column(String(150), nullable=True)
    shipping_address = Column(String(150), nullable=True)

    is_registered = Column(Boolean, nullable=False, server_default="0")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    def __repr__(self):
        return f"<Party party_id={self.party_id} party_type={self.party_type} name={self.name!r}>"