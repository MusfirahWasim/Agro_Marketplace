from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class PartyRead(BaseModel):
    """
    Response shape for a party — used by profile settings, admin user
    lists, and anywhere a party needs to be shown. Deliberately excludes
    password_hash.
    """
    model_config = ConfigDict(from_attributes=True)

    party_id: int
    party_type: Literal["S", "B", "CA", "A"]
    name: str
    phone: Optional[str] = None
    cnic: Optional[str] = None
    email: Optional[EmailStr] = None
    active_status: bool
    credit_limit: Decimal
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    is_registered: bool
    created_at: datetime


class PartyUpdate(BaseModel):
    """
    Self-service profile update (ProfileSettings.jsx). Only fields a
    party can edit about themselves — active_status and credit_limit
    are deliberately excluded here, admin-only via PartyAdminUpdate.
    """
    name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=13)
    email: Optional[EmailStr] = None
    billing_address: Optional[str] = Field(None, max_length=150)
    shipping_address: Optional[str] = Field(None, max_length=150)


class PartyAdminUpdate(BaseModel):
    """Admin-only update — activation toggle and credit limit (AdminUsers.jsx)."""
    active_status: Optional[bool] = None
    credit_limit: Optional[Decimal] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
