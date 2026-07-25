from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

PaymentTerm = Literal["cash", "credit"]
ConsignmentStatus = Literal["pending", "confirmed", "completed", "cancelled"]


class ConsignmentCreate(BaseModel):
    """
    Created by the AGENT (AgentConsignmentIntake.jsx), not the supplier.
    supplier_id/supplier_type are derived server-side from the selected
    supply_id — never trusted from the client. agent_id/agent_type come
    from the authenticated party.

    Service-layer validation required: quantity_consigned must not
    exceed the selected supply's current_stock, and current_stock must
    be decremented by quantity_consigned on success.
    """
    supply_id: int
    quantity_consigned: int = Field(..., gt=0)
    selling_price_per_unit: Decimal = Field(..., gt=0)
    commission_rate: Optional[Decimal] = Field(
        None, gt=0, lt=100, description="Leave blank to use the platform default rate"
    )
    payment_term: PaymentTerm = "credit"


class ConsignmentStatusUpdate(BaseModel):
    """pending -> confirmed -> completed, or -> cancelled at any pre-completed stage."""
    status: ConsignmentStatus


class ConsignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    consigned_id: int
    supply_id: int
    supplier_id: int
    supplier_type: Literal["S"]
    agent_id: int
    agent_type: Literal["CA"]

    payment_term: PaymentTerm
    quantity_consigned: int
    selling_price_per_unit: Decimal
    commission_rate: Optional[Decimal] = None
    quantity_sold: int
    quantity_remaining: int

    consigned_at: datetime
    status: ConsignmentStatus

    # Populated by the service layer when the marketplace/detail views
    # need denormalized display info (product name, agent name, etc.)
    # rather than forcing the frontend to make N+1 lookups.
    item_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    supplier_name: Optional[str] = None
    agent_name: Optional[str] = None