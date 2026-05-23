from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class PhoneLoginRequest(BaseModel):
    phone: str = Field(..., pattern=r'^\+?92\d{10}$')
    otp: Optional[str] = None
    password: Optional[str] = None

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class SignupRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str
    role: str = "customer"

    @field_validator('role')
    def validate_role(cls, v):
        if v not in ['customer', 'provider', 'both']:
            raise ValueError('Invalid role')
        return v
    
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone: str
    role: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True 

class LoginResponse(BaseModel):
    user: UserResponse
    tokens: dict