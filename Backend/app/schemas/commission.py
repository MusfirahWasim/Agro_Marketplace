from typing import Literal, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CommissionRead(BaseModel):
    """
    No CommissionCreate here — commission rows are created internally
    by commission_service.py per sale_item (not per whole sale — see
    the schema fix keying `commissions` to sale_item_id with a unique
    constraint), never submitted directly through the API.

    v1 had a computed `payout_status` field derived from the ledger.
    `accounts` now supports agent ownership too, so this is reinstated —
    computed by the service layer from `transactions` (reference_type=
    'commission', reference_id=commission_id, against the agent's own
    account): 'paid' once that credit transaction exists, 'reversed' if
    a later transaction (adjustment/refund) reverses it, else 'pending'.

    Open question this surfaces: does commission_service.py post that
    credit transaction to the agent's account automatically the moment
    a commission row is created (making payout effectively instant,
    since the agent already holds buyer payments directly and isn't
    waiting on a transfer), or is there a genuine separate payout step?
    Affects whether 'pending' is ever actually reachable in practice.
    """
    model_config = ConfigDict(from_attributes=True)

    commission_id: int
    sale_item_id: int
    agent_id: int
    commission_rate: Decimal
    commission_amount: Decimal
    created_at: datetime

    payout_status: Optional[Literal["pending", "paid", "reversed"]] = None

    # Populated by the service layer for AgentCommissions.jsx /
    # AdminCommissionsOverview.jsx without extra frontend lookups.
    product_name: Optional[str] = None
    sale_id: Optional[int] = None
    buyer_name: Optional[str] = None
