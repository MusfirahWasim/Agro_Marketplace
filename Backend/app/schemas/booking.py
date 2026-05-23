from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BookingCreate(BaseModel):
    provider_id: int
    service_id: int
    address: str
    scheduled_at: datetime
    description: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    user_id: int
    provider_id: int
    provider_user_id: int | None = None

    service_id: int
    status: str
    description: str | None
    address: str
    scheduled_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True