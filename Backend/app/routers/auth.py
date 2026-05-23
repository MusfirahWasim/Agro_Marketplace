from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import PhoneLoginRequest, EmailLoginRequest, TokenResponse, SignupRequest, LoginResponse
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/signup", response_model=TokenResponse)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.signup(data)

@router.post("/login/phone", response_model=TokenResponse)
async def login_phone(data: PhoneLoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login_with_phone(data)

@router.post("/login/email", response_model=LoginResponse)
async def login_email(data: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login_with_email(data)

@router.post("/send-otp")
async def send_otp(phone: str, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.send_otp(phone)
    return {"message": "OTP sent"}

@router.post("/verify-otp")
async def verify_otp(phone: str, otp: str, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.verify_otp(phone, otp)
    return service.create_tokens_for_user(user)

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.refresh_access_token(refresh_token)