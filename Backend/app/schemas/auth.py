from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


# --- Signup / login ---

class SignupRequest(BaseModel):
    """
    Self-registration is only for Commission Agents — the single Admin
    account is seeded directly in the DB, never created through this
    endpoint. role is not a field here (unlike v1's party_type) since
    there is only one possible signup role.

    A newly created user is inserted with active_status=False (see
    auth_service.py) — login is blocked until the Admin approves them.
    active_status doubles as this approval gate; there is no separate
    pending/approved/rejected field (per project decision — see
    dependencies.py note).
    """
    name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=13)
    cnic: Optional[str] = Field(None, max_length=15)
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Tokens ---

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    # included so the frontend can route to the right dashboard
    # immediately after login without a second lookup call
    user_id: int
    role: Literal["ADMIN", "COMMISSION_AGENT"]
    name: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- Forgot / reset password ---
#
# v1's flow was OTP-based (ForgotPasswordRequest -> VerifyOTPRequest ->
# ResetPasswordRequest), which is dropped along with otp_token.py per
# project decision. V2 has no replacement mechanism defined yet — this
# needs a decision (e.g. emailed reset link/token, or Admin-initiated
# reset for agents) before a forgot-password endpoint can be built.