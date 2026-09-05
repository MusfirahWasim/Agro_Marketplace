from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class BuyerCreate(BaseModel):
    """
    Agent registers a buyer (AgentBuyers.jsx). agent_id is not a field
    here — it's taken from the authenticated agent's own identity in
    the route/service, never supplied by the client.
    """
    name: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=13)
    cnic: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    credit_limit: Decimal = Decimal("0.00")
    billing_address: Optional[str] = Field(None, max_length=150)
    shipping_address: Optional[str] = Field(None, max_length=150)


class BuyerUpdate(BaseModel):
    """Agent edits an existing buyer's details."""
    name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=13)
    cnic: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    credit_limit: Optional[Decimal] = None
    billing_address: Optional[str] = Field(None, max_length=150)
    shipping_address: Optional[str] = Field(None, max_length=150)
    active_status: Optional[bool] = None


class BuyerRead(BaseModel):
    """
    Response shape for a buyer — used in AgentBuyers.jsx, AgentCreateSale.jsx
    (buyer picker), AgentLedger.jsx, and Admin's read-only buyer views.
    """
    model_config = ConfigDict(from_attributes=True)

    buyer_id: int
    agent_id: int
    name: str
    phone: Optional[str] = None
    cnic: Optional[str] = None
    email: Optional[EmailStr] = None
    active_status: bool
    credit_limit: Decimal
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime