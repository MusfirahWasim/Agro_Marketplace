from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

TransactionType = Literal[
    "opening_balance", "sale", "purchase", "payment",
    "refund", "commission", "adjustment",
]
ReferenceType = Literal["sale", "payment", "refund", "commission", "manual"]


class TransactionRead(BaseModel):
    """
    This is what v1 called `account.py` (Account/AccountRead) — the
    actual ledger. Renamed because v2's `accounts` table now means
    something different (a thin per-owner header row, see account.py).

    Most rows are written internally: consignment/sale_service.py post
    'sale'/'purchase' entries, commission_service.py posts 'commission'
    entries, payment_service.py posts 'payment'/'refund' entries. None
    of those are exposed as a create schema here — same rule as v1.

    running_balance is NOT a stored column in v2 (the schema comment on
    `transactions` says so explicitly) — account_service.py computes it
    per row by running a cumulative sum ordered by transaction_date,
    rather than v1's approach of storing it on each row directly.
    """
    model_config = ConfigDict(from_attributes=True)

    transaction_id: int
    account_id: int
    transaction_type: TransactionType
    description: str
    debit_amount: Decimal
    credit_amount: Decimal
    reference_type: Optional[ReferenceType] = None
    reference_id: Optional[int] = None
    transaction_date: datetime
    created_by: int

    # Computed, not stored — see docstring.
    running_balance: Optional[Decimal] = None

    # Populated by the service layer for AgentLedger.jsx /
    # AdminOutstandingBalances.jsx without extra frontend lookups.
    owner_name: Optional[str] = None
    owner_type: Optional[Literal["buyer", "supplier", "agent"]] = None
    created_by_name: Optional[str] = None


class ManualTransactionCreate(BaseModel):
    """
    v2's transaction_type='adjustment' + reference_type='manual' imply
    a genuine manual-entry path — e.g. correcting a data-entry mistake
    or recording something outside the normal sale/payment/commission
    flow. account_id is supplied here since, unlike the other flows,
    there's no originating sale/payment to derive it from.
    created_by is taken from the authenticated user, not the body.
    """
    account_id: int
    debit_amount: Decimal = Field(0, ge=0)
    credit_amount: Decimal = Field(0, ge=0)
    description: str = Field(..., max_length=255)