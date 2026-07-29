from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
)
from app.schemas.party import PartyRead
from app.services import auth_service

# prefix + tags declared once here — main.py just does
# app.include_router(auth.router), no prefix/tags repeated there
router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=PartyRead, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Self-registration for Supplier, Buyer, or Commission Agent.
    Admin accounts are seeded directly in the DB and never go through
    this endpoint (data.party_type is restricted to S/B/CA at the
    schema level in SignupRequest).
    """
    return await auth_service.signup(db, data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Single login endpoint for all four roles — no role picker on the
    request. The returned party_type is what the frontend uses to route
    to the right dashboard after login.
    """
    return await auth_service.login(db, data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Exchanges a valid refresh token for a new access/refresh pair."""
    return await auth_service.refresh_access_token(db, data.refresh_token)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Always returns the same generic response whether or not the email
    exists — auth_service.request_password_reset stays silent on
    unknown emails so this endpoint can't be used to enumerate accounts.
    """
    await auth_service.request_password_reset(db, data)
    return {"message": "If that email is registered, an OTP has been sent."}


@router.post("/verify-otp")
async def verify_otp_endpoint(data: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Optional standalone check — lets the frontend confirm an OTP is
    valid before showing the "set new password" screen, without yet
    committing to a password change.
    """
    await auth_service.verify_otp(db, data)
    return {"message": "OTP verified"}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Re-verifies the OTP internally, then sets the new password and marks the OTP used."""
    await auth_service.reset_password(db, data)
    return {"message": "Password has been reset successfully"}