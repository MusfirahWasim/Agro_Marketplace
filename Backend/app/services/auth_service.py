from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.user import User
from app.models.commission_agent import CommissionAgent
from app.models.account import Account
from app.schemas.auth import SignupRequest, LoginRequest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


async def signup(db: AsyncSession, data: SignupRequest) -> User:
    """
    Self-registration is agent-only (see schemas/auth.py) — there is no
    party_type branch here like v1 had. A new agent is inserted with
    active_status=False; they cannot log in until the single Admin
    approves them (see login() below).

    Design decision: this also creates the agent's CommissionAgent
    profile row AND their own ledger Account (opening_balance=0.00) in
    the same flow, all-or-nothing. This resolves the open question left
    in schemas/account.py — account creation happens here, not on
    first login or as a separate admin action. Worth confirming this is
    the right moment for it.
    """
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        role="COMMISSION_AGENT",
        name=data.name,
        phone=data.phone,
        cnic=data.cnic,
        email=data.email,
        password_hash=get_password_hash(data.password),
        active_status=False,
    )
    db.add(user)

    try:
        await db.flush()  # need user.user_id before creating dependent rows
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")

    agent = CommissionAgent(user_id=user.user_id)
    db.add(agent)
    await db.flush()  # need agent.agent_id before creating the account

    account = Account(agent_id=agent.agent_id, opening_balance=0)
    db.add(account)

    await db.commit()
    await db.refresh(user)
    return user


def _build_token_pair(user: User) -> dict:
    token_data = {"sub": str(user.user_id), "role": user.role}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
        "user_id": user.user_id,
        "role": user.role,
        "name": user.name,
    }


async def login(db: AsyncSession, data: LoginRequest) -> dict:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.active_status:
        # Deliberately generic — active_status covers both "pending
        # approval" and "suspended" with no way to tell them apart at
        # the data level (per project decision), so the message doesn't
        # claim to know which one this is.
        raise HTTPException(
            status_code=403,
            detail="This account is inactive. Please contact the administrator.",
        )

    return _build_token_pair(user)


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    """
    Same caveat as v1: no token-revocation store, so a previously
    issued refresh token still works until it naturally expires.
    """
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.user_id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.active_status:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    return _build_token_pair(user)


# Forgot/reset password: no mechanism defined yet (OTP dropped, no
# replacement chosen — see schemas/auth.py). Needs a decision before
# request_password_reset()/reset_password() can be written.
