from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ProviderServiceCreate(BaseModel):
    category_id: int
    title: str
    description: Optional[str] = None
    price: Decimal

class ProviderServiceResponse(ProviderServiceCreate):
    id: int
    provider_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProviderProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: Optional[str] = None
    years_of_experience: Optional[int] = None
    service_radius_km: float
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_featured: int
    created_at: datetime
    updated_at: datetime
    services: List[ProviderServiceResponse] = []

    class Config:
        from_attributes = True

class ProviderSearchFilters(BaseModel):
    lat: float
    lng: float
    category_id: Optional[int] = None
    max_distance_km: float = 10.0


class ProviderLocationUpdate(BaseModel):
    lat: float
    lng: float