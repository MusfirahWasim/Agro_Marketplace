from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKeyConstraint, func
from sqlalchemy.dialects.mysql import INTEGER, ENUM
from sqlalchemy.orm import relationship
from app.core.database import Base


class OTPToken(Base):
    """
    Maps to `otp_tokens` — supports the forgot-password flow (SMS or
    email OTP). NOTE: this table is not yet in Updated_agro.sql; a
    matching CREATE TABLE needs to be added there before this model
    will work against the real database.
    """

    __tablename__ = "otp_tokens"
    __table_args__ = (
        ForeignKeyConstraint(
            ["party_id", "party_type"],
            ["parties.party_id", "parties.party_type"],
        ),
    )

    otp_id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    party_id = Column(INTEGER(unsigned=True), nullable=False)
    party_type = Column(ENUM("S", "B", "CA", "A"), nullable=False)

    otp_code = Column(String(10), nullable=False)
    purpose = Column(ENUM("password_reset"), nullable=False, server_default="password_reset")

    is_used = Column(Boolean, nullable=False, server_default="0")
    expires_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    party = relationship(
        "Party",
        foreign_keys=[party_id, party_type],
        backref="otp_tokens",
    )

    def __repr__(self):
        return f"<OTPToken otp_id={self.otp_id} party_id={self.party_id} used={self.is_used}>"
