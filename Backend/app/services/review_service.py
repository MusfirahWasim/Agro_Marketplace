from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.review import Review
from app.models.booking import Booking
from app.schemas.review import ReviewCreate
from app.services.ai_services import AIService
from fastapi import HTTPException
from sqlalchemy.orm import selectinload

class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_review(self, user_id: int, data: ReviewCreate):
        # 1. Fetch the booking
        stmt = (
            select(Booking)
            .options(selectinload(Booking.provider))
            .where(Booking.id == data.booking_id)
        )
        result = await self.db.execute(stmt)
        booking = result.scalar_one_or_none()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # 2. Authorization checks
        if booking.user_id != user_id and booking.provider.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to review this booking")
            
        if booking.status != "completed":
            raise HTTPException(status_code=400, detail="Can only review completed jobs")

        # 3. Determine roles (Who is reviewing whom?)
        if booking.user_id == user_id:
            reviewer_role = "customer"
            reviewee_id = booking.provider.user_id
        else:
            reviewer_role = "provider"
            reviewee_id = booking.user_id

        # 4. Check if a review from this user for this booking already exists
        stmt = select(Review).where(
            Review.booking_id == data.booking_id, 
            Review.reviewer_id == user_id
        )
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="You have already reviewed this job")

        # 5. AI MAGIC: Auto-Moderate the comment
        is_verified = True
        if data.comment:
            is_verified = await AIService.analyze_review(data.comment)

        # 6. Save the review
        review = Review(
            booking_id=data.booking_id,
            reviewer_id=user_id,
            reviewee_id=reviewee_id,
            reviewer_role=reviewer_role,
            rating=data.rating,
            comment=data.comment,
            is_verified=is_verified # Set by AI
        )
        
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def get_reviews_for_user(self, user_id: int):
        """Fetch all verified reviews targeted AT this user"""
        stmt = select(Review).where(
            Review.reviewee_id == user_id,
            Review.is_verified == True  # Only show AI-approved reviews
        ).order_by(Review.created_at.desc())
        
        result = await self.db.execute(stmt)
        return result.scalars().all()