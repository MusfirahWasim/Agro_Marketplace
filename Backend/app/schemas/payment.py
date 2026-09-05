from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

PaymentMethod = Literal["cash", "bank_transfer", "card", "other"]


class PaymentCreate(BaseModel):
    """
    Unlike v1's payer_id/payer_type + payee_id/payee_type pair, v2's
    `payments` table ties a payment to a single account_id — direction
    (buyer paying in vs. agent paying a supplier out) is implied by
    whether that account belongs to a buyer or a supplier, not stated
    explicitly here. agent_id and created_by are NOT accepted from the
    client — both are the authenticated agent recording the payment.
    """
    account_id: int
    amount_paid: Decimal = Field(..., gt=0)
    payment_method: PaymentMethod = "cash"
    transaction_reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=255)
    payment_date: Optional[datetime] = None  # defaults to now in the service layer


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_id: int
    account_id: int
    agent_id: int
    amount_paid: Decimal
    payment_method: PaymentMethod
    transaction_reference: Optional[str] = None
    payment_date: datetime
    notes: Optional[str] = None
    created_by: int

    # Populated by the service layer for AgentPayments.jsx /
    # AgentLedger.jsx without extra frontend lookups.
    owner_name: Optional[str] = None
    owner_type: Optional[Literal["buyer", "supplier"]] = None
    agent_name: Optional[str] = None

    # A receipt is always generated alongside a payment (see
    # payment_service.py / receipt.py) — surfaced here so the frontend
    # can link/print it without a second lookup.
    receipt_number: Optional[str] = None