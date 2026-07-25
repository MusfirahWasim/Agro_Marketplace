from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


# --- Signup / login ---

class SignupRequest(BaseModel):
    """
    Self-registration is only allowed for S/B/CA — Admin accounts are
    seeded directly in the DB, never created through this endpoint.
    """
    name: str = Field(..., max_length=50)
    party_type: Literal["S", "B", "CA"]
    phone: Optional[str] = Field(None, max_length=13)
    cnic: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8)
    billing_address: Optional[str] = Field(None, max_length=150)
    shipping_address: Optional[str] = Field(None, max_length=150)


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
    party_id: int
    party_type: Literal["S", "B", "CA", "A"]
    name: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- Forgot password (OTP-based) ---

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=4, max_length=10)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=8)
