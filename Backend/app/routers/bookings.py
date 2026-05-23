from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import BookingService

router = APIRouter()

@router.post("/", response_model=BookingResponse, status_code=201)
async def create_booking(
    data: BookingCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = BookingService(db)
    return await service.create_booking(current_user.id, data)

@router.get("/", response_model=List[BookingResponse])
async def get_my_bookings(
    status: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = BookingService(db)
    return await service.get_user_bookings(current_user.id, status)

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = BookingService(db)
    booking = await service.get_booking(booking_id)
    if booking.user_id != current_user.id and booking.provider.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    return booking

@router.patch("/{booking_id}/status")
async def update_booking_status(
    booking_id: int,
    status: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = BookingService(db)
    booking = await service.update_status(booking_id, status, current_user)
    return {
        "message": f"Booking {status} successfully",
        "booking": {
            "id": booking.id,
            "status": booking.status,
            "scheduled_at": booking.scheduled_at,
            "user_id": booking.user_id,
            "provider_id": booking.provider_id
        }
    }