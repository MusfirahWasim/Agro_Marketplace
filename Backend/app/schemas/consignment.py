from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

PaymentTerm = Literal["cash", "credit"]
ConsignmentStatus = Literal["pending", "confirmed", "completed", "cancelled"]


class ConsignmentCreate(BaseModel):
    """
    Created by the AGENT (AgentConsignmentIntake.jsx). supplier_id is
    derived server-side from the selected supplier_supply_id — never
    trusted from the client. agent_id comes from the authenticated
    agent, not v1's agent_id/agent_type pair (only one agent role now).

    Service-layer validation required: quantity_consigned must not
    exceed the selected supplier_supply's quantity_available, and
    quantity_available must be decremented by quantity_consigned on
    success (mirroring v1's current_stock decrement, now against
    supplier_supplies instead of supply).

    Quantities are Decimal(12,3) here, not int like v1 — v2's products
    carry units (kg, ton, etc.) that support fractional quantities.
    """
    supplier_supply_id: int
    quantity_consigned: Decimal = Field(..., gt=0, decimal_places=3)
    selling_price_per_unit: Decimal = Field(..., gt=0)
    commission_rate: Optional[Decimal] = Field(
        None, gt=0, lt=100,
        description="Leave blank to use the agent's own default commission_rate",
    )
    payment_term: PaymentTerm = "credit"


class ConsignmentStatusUpdate(BaseModel):
    """pending -> confirmed -> completed, or -> cancelled at any pre-completed stage."""
    status: ConsignmentStatus


class ConsignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    consignment_id: int
    supplier_supply_id: int
    supplier_id: int
    agent_id: int

    payment_term: PaymentTerm
    quantity_consigned: Decimal
    selling_price_per_unit: Decimal
    commission_rate: Decimal
    quantity_sold: Decimal

    consigned_at: datetime
    status: ConsignmentStatus

    # quantity_remaining is not a stored column in v2 (derive, don't
    # store — same principle as balances in accounts/transactions) —
    # computed by the service layer as quantity_consigned - quantity_sold
    quantity_remaining: Optional[Decimal] = None

    # Populated by the service layer when detail views need
    # denormalized display info rather than forcing the frontend into
    # N+1 lookups.
    product_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    supplier_name: Optional[str] = None
    agent_name: Optional[str] = None
    description: Optional[str] = None
