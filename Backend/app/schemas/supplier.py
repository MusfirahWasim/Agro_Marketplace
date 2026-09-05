from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class SupplierCreate(BaseModel):
    """
    Agent registers a supplier (AgentSuppliers.jsx). agent_id is not a
    field here — it's taken from the authenticated agent's own identity
    in the route/service, never supplied by the client.
    """
    name: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=13)
    cnic: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    credit_limit: Decimal = Decimal("0.00")
    billing_address: Optional[str] = Field(None, max_length=150)
    shipping_address: Optional[str] = Field(None, max_length=150)


class SupplierUpdate(BaseModel):
    """Agent edits an existing supplier's details."""
    name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=13)
    cnic: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    credit_limit: Optional[Decimal] = None
    billing_address: Optional[str] = Field(None, max_length=150)
    shipping_address: Optional[str] = Field(None, max_length=150)
    active_status: Optional[bool] = None


class SupplierRead(BaseModel):
    """
    Response shape for a supplier — used in AgentSuppliers.jsx,
    AgentConsignmentIntake.jsx (supplier picker), AgentLedger.jsx, and
    Admin's read-only supplier views.
    """
    model_config = ConfigDict(from_attributes=True)

    supplier_id: int
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