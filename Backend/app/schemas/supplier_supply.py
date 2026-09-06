from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

SupplyStatus = Literal["available", "depleted", "cancelled"]


class SupplierSupplyCreate(BaseModel):
    """
    Agent records incoming stock from a supplier (AgentSuppliers.jsx /
    AgentConsignmentIntake.jsx intake step). supplier_id is NOT part of
    this schema — it's supplied separately (path param or resolved from
    context), never trusted from the body alongside product_id.

    Unlike v1's SupplyCreate, item_name/category/unit are gone — those
    now live on the shared products table and are referenced by
    product_id instead of being entered freehand per supply.
    """
    product_id: int
    quantity_available: Decimal = Field(..., ge=0, decimal_places=3)
    cost_per_unit: Decimal = Field(..., gt=0)
    description: Optional[str] = Field(None, max_length=255)


class SupplierSupplyUpdate(BaseModel):
    quantity_available: Optional[Decimal] = Field(None, ge=0, decimal_places=3)
    cost_per_unit: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=255)
    status: Optional[SupplyStatus] = None


class SupplierSupplyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    supplier_supply_id: int
    supplier_id: int
    product_id: int
    quantity_available: Decimal
    cost_per_unit: Decimal
    description: Optional[str] = None
    status: SupplyStatus
    created_at: datetime
    updated_at: datetime

    # Populated by the service layer joining products/suppliers, so the
    # frontend doesn't need N+1 lookups (same pattern as v1's ConsignmentRead)
    product_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    supplier_name: Optional[str] = None
