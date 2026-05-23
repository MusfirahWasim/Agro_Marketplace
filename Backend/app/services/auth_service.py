from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.models.provider import Provider
from app.models.otp_token import OTPToken
from app.schemas.auth import SignupRequest, PhoneLoginRequest, EmailLoginRequest, LoginResponse
# from app.utils.otp import generate_otp, send_sms_otp # Assuming you have these
from fastapi import HTTPException, status

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def signup(self, data: SignupRequest):
        # Check existing
        stmt = select(User).where(User.phone == data.phone)
        if (await self.db.execute(stmt)).scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone already registered")
            
        if data.email:
            stmt = select(User).where(User.email == data.email)
            if (await self.db.execute(stmt)).scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            password_hash=get_password_hash(data.password),
            role=data.role
        )
        
        self.db.add(user)
        await self.db.flush() # Flush to get the user.id generated

        # Auto-create Provider profile if applicable
        if data.role in ["provider", "both"]:
            provider = Provider(user_id=user.id)
            self.db.add(provider)

        await self.db.commit()
        await self.db.refresh(user)

        return self.create_tokens_for_user(user)

    async def login_with_phone(self, data: PhoneLoginRequest):
        if data.otp:
            user = await self.verify_otp(data.phone, data.otp)
        else:
            stmt = select(User).where(User.phone == data.phone)
            user = (await self.db.execute(stmt)).scalar_one_or_none()
            if not user or not verify_password(data.password, user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid credentials")
                
        return self.create_tokens_for_user(user)

    async def login_with_email(self, data: EmailLoginRequest):
        stmt = select(User).where(User.email == data.email)
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        return LoginResponse(
            user=user, # Pydantic will validate this automatically
            tokens=self.create_tokens_for_user(user)
        )

    def create_tokens_for_user(self, user: User):
        payload = {"sub": str(user.id), "role": user.role}
        access = create_access_token(payload)
        refresh = create_refresh_token(payload)
        return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

    async def send_otp(self, phone: str):
        otp = "123456" # Replace with generate_otp()
        expires = datetime.utcnow() + timedelta(minutes=5)
        token = OTPToken(user_id=None, type="login", token=otp, expires_at=expires)
        self.db.add(token)
        await self.db.commit()
        # await send_sms_otp(phone, otp)

    async def verify_otp(self, phone: str, otp: str) -> User:
        stmt = select(OTPToken).where(OTPToken.token == otp, OTPToken.expires_at > datetime.utcnow(), OTPToken.is_used == False)
        token = (await self.db.execute(stmt)).scalar_one_or_none()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
            
        token.is_used = True
        
        stmt = select(User).where(User.phone == phone)
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        await self.db.commit()
        return user

    async def refresh_access_token(self, refresh_token: str):
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        new_access = create_access_token({"sub": payload.get("sub"), "role": payload.get("role")})
        return {"access_token": new_access, "token_type": "bearer"}