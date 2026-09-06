from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.commission_agent import CommissionAgent

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolves the JWT into a `users` row. V2 has a single, simple primary
    key (user_id) instead of v1's composite (party_id + party_type), so
    the token payload only needs `sub` = user_id.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(User).where(User.user_id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.active_status:
        # active_status doubles as the approval gate for agents: a
        # newly-signed-up agent starts at active_status=0 until the
        # Admin approves them, and this same check also covers a
        # later-suspended agent. See note in auth_service.py if this
        # needs to be split into a separate approval_status field.
        raise credentials_exception

    return user


def require_role(*allowed_roles: str):
    """
    allowed_roles uses the same values as users.role:
    'ADMIN' or 'COMMISSION_AGENT'
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker


# Convenience dependencies for the two roles — use these directly in
# routers instead of calling require_role(...) inline everywhere
require_admin = require_role("ADMIN")
require_agent = require_role("COMMISSION_AGENT")


async def get_current_agent(
    current_user: User = Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Resolves the authenticated user's CommissionAgent row — nearly
    every agent-facing router needs agent_id (commission_agents.agent_id),
    which is a different id than user_id. Deliberately does an explicit
    query rather than accessing current_user.commission_agent directly —
    that relationship is lazy-loaded, and touching it outside an active
    async session context (e.g. after the request that loaded `User`
    has moved on) raises MissingGreenlet under SQLAlchemy's async mode.
    An explicit select here is always safe regardless of load state.
    """
    result = await db.execute(
        select(CommissionAgent).where(CommissionAgent.user_id == current_user.user_id)
    )
    agent = result.scalar_one_or_none()
    if agent is None:
        # Shouldn't happen — every COMMISSION_AGENT user gets one at
        # signup — but fail loudly rather than silently if it ever does.
        raise HTTPException(status_code=500, detail="Agent profile not found for this user")
    return agent