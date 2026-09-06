from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, RefreshTokenRequest
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Self-registration is agent-only — there's no role picker on the
    request (unlike v1's party_type), since Admin is a single, seeded
    account that never goes through this endpoint.

    The created user has active_status=False — they cannot log in
    until the Admin approves them (see AdminAgents.jsx / admin.py's
    approve endpoint).
    """
    return await auth_service.signup(db, data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Single login endpoint for both roles. The returned `role` is what
    the frontend uses to route to /admin/* or /agent/*.
    """
    return await auth_service.login(db, data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Exchanges a valid refresh token for a new access/refresh pair."""
    return await auth_service.refresh_access_token(db, data.refresh_token)


# forgot-password / reset-password: no mechanism defined yet (OTP
# dropped, no replacement chosen — see schemas/auth.py and
# auth_service.py). No stub endpoints here until that's decided.
