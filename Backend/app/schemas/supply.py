from typing import Literal, Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

UnitType = Literal["kg", "bag", "crate", "dozen", "ton", "maund"]


class SupplyCreate(BaseModel):
    """
    supplier_id/supplier_type are NOT part of this schema — they're
    taken from the authenticated party in the router, never trusted
    from the request body.
    """
    item_name: str = Field(..., max_length=50)
    category: str = Field(default="Uncategorized", max_length=30)
    unit: UnitType = "kg"
    current_stock: int = Field(..., ge=0)
    cost_per_unit: Decimal = Field(..., gt=0)
    description: Optional[str] = Field(None, max_length=200)


class SupplyUpdate(BaseModel):
    item_name: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=30)
    unit: Optional[UnitType] = None
    current_stock: Optional[int] = Field(None, ge=0)
    cost_per_unit: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=200)


class SupplyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    supply_id: int
    supplier_id: int
    supplier_type: Literal["S"]
    item_name: str
    category: str
    unit: UnitType
    current_stock: int
    cost_per_unit: Decimal
    description: Optional[str] = None
