from typing import Literal, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

PartyTypeForMoney = Literal["S", "B", "CA"]
PaymentMethod = Literal["cash", "card", "other"]


class PaymentCreate(BaseModel):
    """
    Covers all three payment directions through one schema:
      - buyer -> agent   (buyer settling an order)
      - agent -> supplier (settlement of consigned sales)
      - refund            (either direction, order_id required)

    payer_id/payer_type are NOT accepted from the client — the payer is
    always the authenticated party (whoever is logged in and calling
    this endpoint). Only the payee is specified here.
    """
    payee_id: int
    payee_type: PartyTypeForMoney
    payment_method: PaymentMethod
    order_id: Optional[int] = None
    amount_paid: Decimal = Field(..., gt=0)
    transaction_reference: Optional[str] = Field(None, max_length=100)
    payment_date: Optional[date] = None  # defaults to today in the service layer


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_id: int
    payer_id: int
    payer_type: PartyTypeForMoney
    payee_id: int
    payee_type: PartyTypeForMoney
    payment_method: PaymentMethod
    order_id: Optional[int] = None
    amount_paid: Decimal
    transaction_reference: Optional[str] = None
    payment_date: date

    payer_name: Optional[str] = None
    payee_name: Optional[str] = None
