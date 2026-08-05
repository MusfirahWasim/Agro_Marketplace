from sqlalchemy import Column, DECIMAL, ForeignKey
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from sqlalchemy.orm import relationship
from app.core.database import Base


class Commission(Base):
    """
    Maps to `commissions`. Note there is no status column here (no
    paid/pending/reversed) — per our earlier decision, whether a
    commission has been paid out is derived by checking `accounts` for
    a matching transaction_type='commission' row, not stored on this
    table directly.
    """

    __tablename__ = "commissions"

    commission_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    order_id = Column(
        INTEGER(unsigned=True),
        ForeignKey("orders.order_id"),
        nullable=False,
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

    commission_rate = Column(DECIMAL(5, 2), nullable=False)
    commission_amount = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("Order", backref="commissions")

    agent = relationship(
        "Party",
        foreign_keys=[agent_id],
        backref="commissions",
    )

    def __repr__(self):
        return (
            f"<Commission commission_id={self.commission_id} "
            f"commission_amount={self.commission_amount}>"
        )