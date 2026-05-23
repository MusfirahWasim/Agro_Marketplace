from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.dependencies import get_current_user, get_current_provider
from app.core.database import get_db
from app.schemas.provider import ProviderProfileResponse, ProviderServiceCreate, ProviderServiceResponse
from app.services.provider_service import ProviderService

router = APIRouter()

@router.get("/all-services")
async def get_all_provider_services(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    service = ProviderService(db)
    services = await service.get_all_services(skip=skip, limit=limit)
    return {"message": "Services retrieved successfully", "count": len(services), "data": services}
    
@router.get("/search")
async def search_providers(
    lat: float,
    lng: float,
    category_id: Optional[int] = None,
    max_distance_km: float = 10.0,
    db: AsyncSession = Depends(get_db)
):
    service = ProviderService(db)
    return await service.search_providers(lat, lng, category_id, max_distance_km)


@router.post("/me/services")
async def add_service(
    data: ProviderServiceCreate,
    current_user = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db)
):
    service = ProviderService(db)
    provider = await service.get_provider_by_user(current_user.id)
    return await service.create_service(provider.id, data)

from app.schemas.provider import ProviderLocationUpdate # Import the new schema

@router.get("/me", response_model=ProviderProfileResponse)
async def get_my_provider_profile(
    current_user = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db)
):
    """Get the logged-in user's provider profile"""
    service = ProviderService(db)
    return await service.get_provider_by_user(current_user.id)

@router.put("/me/location", response_model=ProviderProfileResponse)
async def update_my_location(
    data: ProviderLocationUpdate,
    current_user = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db)
):
    """Update the provider's coordinates"""
    service = ProviderService(db)
    provider = await service.get_provider_by_user(current_user.id)
    return await service.update_location(provider.id, data.lat, data.lng)


@router.get("/{provider_id}")
async def get_provider_profile(provider_id: int, db: AsyncSession = Depends(get_db)):
    service = ProviderService(db)
    return await service.get_provider_details(provider_id)