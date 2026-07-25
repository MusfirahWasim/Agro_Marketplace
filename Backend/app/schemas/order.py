from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

PaymentTerm = Literal["cash", "credit"]
OrderStatus = Literal["pending", "confirmed", "completed", "cancelled"]


class OrderCreate(BaseModel):
    """
    Created by the BUYER at checkout (BuyerCheckout.jsx). rate_per_unit
    and total_amount are deliberately NOT accepted from the client —
    the service layer reads selling_price_per_unit off the referenced
    consignment at order time and computes total_amount itself, so a
    buyer can never submit a tampered price.

    Service-layer validation required: quantity_ordered must not exceed
    the consignment's quantity_remaining, and quantity_sold/
    quantity_remaining on the consignment must be updated on success.
    """
    consigned_id: int
    quantity_ordered: int = Field(..., gt=0)
    payment_term: PaymentTerm


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: int
    buyer_id: int
    buyer_type: Literal["B"]
    consigned_id: int

    quantity_ordered: int
    rate_per_unit: Decimal
    total_amount: Decimal

    payment_term: PaymentTerm
    status: OrderStatus

    order_date: datetime
    delivery_date: Optional[datetime] = None

    # Denormalized display fields, populated by the service layer —
    # matches what BuyerOrders.jsx / AgentOrders.jsx actually render
    # (product name, buyer/agent name) without extra frontend lookups.
    product_name: Optional[str] = None
    buyer_name: Optional[str] = None
    agent_name: Optional[str] = None

    # Computed, not stored — per our earlier decision that payment
    # status (Paid/Due/Refunded) must be derived from `payments`,
    # never conflated with order fulfillment `status` above.
    payment_status: Optional[Literal["paid", "due", "partially_paid", "refunded"]] = None
    amount_paid: Optional[Decimal] = None
