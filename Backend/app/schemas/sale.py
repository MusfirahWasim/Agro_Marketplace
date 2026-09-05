from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.sale_item import SaleItemCreate, SaleItemRead

PaymentTerm = Literal["cash", "credit", "partial"]
SaleStatus = Literal["pending", "confirmed", "completed", "cancelled"]
SalePaymentStatus = Literal["unpaid", "partial", "paid"]


class SaleCreate(BaseModel):
    """
    Created by the AGENT (AgentCreateSale.jsx), on behalf of a buyer who
    is physically present. Unlike v1's single-item OrderCreate, a sale
    is a header with one or more line items — each item picks its own
    consignment/quantity, since a single sale can pull stock from
    multiple consignments (even multiple products) at once.

    subtotal/commission_amount/total_amount are NOT accepted from the
    client — the service layer computes them from the referenced
    consignments' selling_price_per_unit and commission_rate, exactly
    as v1 never trusted a buyer-submitted rate_per_unit.

    agent_id comes from the authenticated agent, not the body.
    """
    buyer_id: int
    payment_term: PaymentTerm
    items: list[SaleItemCreate] = Field(..., min_length=1)


class SaleStatusUpdate(BaseModel):
    status: SaleStatus


class SaleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sale_id: int
    agent_id: int
    buyer_id: int

    sale_date: datetime
    payment_term: PaymentTerm

    subtotal: Decimal
    commission_amount: Decimal
    total_amount: Decimal

    payment_status: SalePaymentStatus
    status: SaleStatus
    delivery_date: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    # Populated by the service layer — matches what AgentSales.jsx /
    # AdminSalesOverview.jsx render without extra frontend lookups.
    buyer_name: Optional[str] = None
    agent_name: Optional[str] = None
    items: list[SaleItemRead] = []