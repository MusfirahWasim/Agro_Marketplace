from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserRead(BaseModel):
    """
    Response shape for a user — used by profile settings, admin agent
    lists, and anywhere a user needs to be shown. Deliberately excludes
    password_hash. Agent-specific fields (commission_rate) live on
    CommissionAgent's own schema, not here — join/embed as needed.
    """
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    role: Literal["ADMIN", "COMMISSION_AGENT"]
    name: str
    phone: Optional[str] = None
    cnic: Optional[str] = None
    email: EmailStr
    active_status: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    """
    Self-service profile update (ProfileSettings.jsx). Only fields a
    user can edit about themselves — active_status is deliberately
    excluded here, admin-only via UserAdminUpdate.
    """
    name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=13)
    email: Optional[EmailStr] = None


class UserAdminUpdate(BaseModel):
    """
    Admin-only update (AdminAgents.jsx) — this is the approve/suspend
    toggle. Setting active_status True on a newly-signed-up agent is
    the approval action; setting it False again later is a suspension.
    v1's PartyAdminUpdate also had credit_limit here, but that concept
    now lives on buyer.py/supplier.py, not users.
    """
    active_status: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
