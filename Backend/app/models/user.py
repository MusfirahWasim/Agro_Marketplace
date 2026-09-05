from sqlalchemy import Column, String, TIMESTAMP, Boolean, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from app.core.database import Base


class User(Base):
    """
    Maps to the `users` table. Replaces v1's shared `parties` table for
    login purposes — only ADMIN and COMMISSION_AGENT roles exist here;
    buyers/suppliers never log in and live in their own tables instead.

    active_status doubles as the agent-approval gate (see
    dependencies.py / auth_service.py): a newly-signed-up agent starts
    at active_status=False until the single Admin approves them; the
    same flag is reused later to suspend an agent. There is no separate
    pending/approved/rejected field — this was a deliberate decision to
    avoid a schema change.
    """

    __tablename__ = "users"

    user_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(13), nullable=True)
    cnic = Column(String(15), unique=True, nullable=True)

    password_hash = Column(String(255), nullable=False)

    role = Column(ENUM("ADMIN", "COMMISSION_AGENT"), nullable=False)

    # New agent signups are inserted with active_status=False; the
    # single Admin flips this to True to approve. Defaulting to True at
    # the DB level (per the schema) is fine since the one Admin account
    # is seeded directly and never goes through this gate.
    active_status = Column(Boolean, nullable=False, server_default="1")

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    # One-to-one — only populated when role == 'COMMISSION_AGENT'
    commission_agent = relationship(
        "CommissionAgent",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User user_id={self.user_id} role={self.role} name={self.name!r}>"