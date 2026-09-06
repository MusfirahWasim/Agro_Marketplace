from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

ProductUnit = Literal["kg", "bag", "crate", "dozen", "ton", "maund"]


class ProductCreate(BaseModel):
    """Agent adds a product to the master list (AgentProducts.jsx)."""
    name: str = Field(..., max_length=100)
    category: str = Field("Uncategorized", max_length=50)
    unit: ProductUnit = "kg"
    description: Optional[str] = Field(None, max_length=255)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    unit: Optional[ProductUnit] = None
    description: Optional[str] = Field(None, max_length=255)
    active_status: Optional[bool] = None


class ProductRead(BaseModel):
    """
    Response shape for a product — used in AgentProducts.jsx and
    everywhere a product needs to be picked (supplier_supplies,
    consignments, sale_items).
    """
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    name: str
    category: str
    unit: ProductUnit
    description: Optional[str] = None
    active_status: bool
    created_at: datetime
