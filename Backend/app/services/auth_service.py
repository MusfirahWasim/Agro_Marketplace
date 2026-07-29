import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.party import Party
from app.models.otp_token import OTPToken
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.notifications import send_otp_email


async def signup(db: AsyncSession, data: SignupRequest) -> Party:
    # Email uniqueness is enforced here at the service level. Composite
    # PK (party_id, party_type) doesn't give us a DB-level unique
    # constraint on email — add one at the DB layer too if possible,
    # this check alone has a small race-condition window.
    existing = await db.execute(select(Party).where(Party.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    party = Party(
        party_type=data.party_type,
        name=data.name,
        phone=data.phone,
        cnic=data.cnic,
        email=data.email,
        password_hash=get_password_hash(data.password),
        billing_address=data.billing_address,
        shipping_address=data.shipping_address,
        is_registered=True,
    )
    db.add(party)
    await db.commit()
    await db.refresh(party)
    return party


def _build_token_pair(party: Party) -> dict:
    # token payload carries BOTH halves of the composite key —
    # dependencies.py's get_current_party relies on party_type being
    # present as its own claim, not just embedded in sub
    token_data = {"sub": str(party.party_id), "party_type": party.party_type}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "party_id": party.party_id,
        "party_type": party.party_type,
        "name": party.name,
    }


async def login(db: AsyncSession, data: LoginRequest) -> dict:
    result = await db.execute(select(Party).where(Party.email == data.email))
    party = result.scalar_one_or_none()

    if not party or not party.password_hash or not verify_password(
        data.password, party.password_hash
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not party.active_status:
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    return _build_token_pair(party)


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    """
    Exchanges a valid, unexpired refresh token for a brand new
    access/refresh pair. NOTE: this doesn't blacklist the old refresh
    token — there's no token-revocation store yet, so a previously
    issued refresh token technically still works until it expires on
    its own. Fine for MVP, worth revisiting before production.
    """
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    party_id = payload.get("sub")
    party_type = payload.get("party_type")
    if party_id is None or party_type is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    result = await db.execute(
        select(Party).where(
            Party.party_id == int(party_id), Party.party_type == party_type
        )
    )
    party = result.scalar_one_or_none()

    if not party or not party.active_status:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    return _build_token_pair(party)


async def request_password_reset(db: AsyncSession, data: ForgotPasswordRequest) -> None:
    result = await db.execute(select(Party).where(Party.email == data.email))
    party = result.scalar_one_or_none()

    # Deliberately silent if the email doesn't exist — don't reveal
    # whether an account is registered under a given email.
    if not party:
        return

    otp_code = f"{random.randint(0, 999999):06d}"
    token = OTPToken(
        party_id=party.party_id,
        party_type=party.party_type,
        otp_code=otp_code,
        purpose="password_reset",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(token)
    await db.commit()

    await send_otp_email(party.email, otp_code)


async def verify_otp(db: AsyncSession, data: VerifyOTPRequest) -> OTPToken:
    result = await db.execute(select(Party).where(Party.email == data.email))
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    result = await db.execute(
        select(OTPToken)
        .where(
            OTPToken.party_id == party.party_id,
            OTPToken.party_type == party.party_type,
            OTPToken.otp_code == data.otp_code,
            OTPToken.is_used == False,  # noqa: E712
        )
        .order_by(OTPToken.created_at.desc())
    )
    token = result.scalars().first()

    if not token or token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return token


async def reset_password(db: AsyncSession, data: ResetPasswordRequest) -> None:
    token = await verify_otp(
        db, VerifyOTPRequest(email=data.email, otp_code=data.otp_code)
    )

    result = await db.execute(
        select(Party).where(
            Party.party_id == token.party_id, Party.party_type == token.party_type
        )
    )
    party = result.scalar_one()

    party.password_hash = get_password_hash(data.new_password)
    token.is_used = True
    await db.commit()