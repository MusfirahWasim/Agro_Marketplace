from typing import Literal, Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class CommissionRead(BaseModel):
    """
    No CommissionCreate here — commission rows are created internally
    by commission_service.py when an order is marked completed, never
    submitted directly through the API.

    payout_status is NOT a column on `commissions` — it's computed by
    the service layer by checking `accounts` for a matching
    transaction_type='commission' row (paid) or a follow-up
    transaction_type='refund' row (reversed). See our earlier decision
    on this.
    """
    model_config = ConfigDict(from_attributes=True)

    commission_id: int
    order_id: int
    agent_id: int
    agent_type: Literal["CA"]
    commission_rate: Decimal
    commission_amount: Decimal

    payout_status: Optional[Literal["pending", "paid", "reversed"]] = None
