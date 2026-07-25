from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse
from app.schemas.party import PartyRead
from app.services import auth_service

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