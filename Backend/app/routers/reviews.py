from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review_service import ReviewService
from typing import List


router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def create_review(
    data: ReviewCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ReviewService(db)
    return await service.create_review(current_user.id, data)

@router.get("/provider/{provider_id}", response_model=List[ReviewResponse])
async def get_provider_reviews(
    provider_id: int,
    db: AsyncSession = Depends(get_db)
):
    service = ReviewService(db)
    return await service.get_reviews_for_provider(provider_id)

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all VERIFIED reviews for a specific user (provider or customer).
    """
    service = ReviewService(db)
    return await service.get_reviews_for_user(user_id)