from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class SaleItemCreate(BaseModel):
    """
    One line of a sale (nested inside SaleCreate.items). Mirrors v1's
    OrderCreate shape at the item level — quantity is client-supplied,
    rate is looked up server-side from the consignment, never trusted
    from the client.

    Service-layer validation required: quantity must not exceed the
    consignment's quantity_remaining, and quantity_sold on the
    consignment must be incremented on success (same rule v1 applied
    at the order level, now applied per item). Commission is then
    calculated per sale_item once the row exists (see commission.py).
    """
    consignment_id: int
    quantity: Decimal = Field(..., gt=0, decimal_places=3)


class SaleItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sale_item_id: int
    sale_id: int
    consignment_id: int

    quantity: Decimal
    rate_per_unit: Decimal
    total_amount: Decimal

    # Populated by the service layer joining consignments/products, so
    # the frontend doesn't need N+1 lookups per line item.
    product_name: Optional[str] = None
    unit: Optional[str] = None
    supplier_name: Optional[str] = None

    # Populated when this item's commission has been calculated —
    # None until the sale reaches whatever status triggers commission
    # creation (mirrors v1's completed-order -> commission trigger).
    commission_amount: Optional[Decimal] = None