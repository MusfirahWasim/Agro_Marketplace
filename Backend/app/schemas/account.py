from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class AccountRead(BaseModel):
    """
    accounts is a thin header row — one per buyer, supplier, OR agent
    (exactly one of the three, enforced by a DB CHECK constraint),
    holding just the opening_balance. Agent accounts exist so commission
    payouts can be tracked through the same ledger as buyer/supplier
    balances (see commission.py's payout_status, which relies on this).

    The actual ledger activity lives in `transactions` (see
    transaction.py); current_balance here is NOT a stored column —
    it's opening_balance plus the net of that account's transactions,
    computed by account_service.py, same derive-don't-store principle
    already used for consignment.quantity_remaining.

    No AccountCreate is exposed here — open question for
    buyer_service.py / supplier_service.py / auth_service.py: is
    opening_balance supplied at registration time (auto-creating this
    row behind the scenes), or set via a separate step afterward? Needs
    deciding before those services are built. For agents specifically,
    account creation likely belongs in auth_service.py's signup flow
    (alongside the users + commission_agents rows), not agent-triggered.
    """
    model_config = ConfigDict(from_attributes=True)

    account_id: int
    buyer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    agent_id: Optional[int] = None
    owner_type: Literal["buyer", "supplier", "agent"]
    opening_balance: Decimal
    created_at: datetime

    # Computed, not stored.
    current_balance: Optional[Decimal] = None

    # Populated by the service layer for AgentLedger.jsx /
    # AdminOutstandingBalances.jsx without extra frontend lookups.
    owner_name: Optional[str] = None
