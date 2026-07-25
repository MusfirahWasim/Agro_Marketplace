from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

PartyTypeForMoney = Literal["S", "B", "CA"]
TransactionType = Literal["payment", "refund", "commission"]


class AccountRead(BaseModel):
    """
    The ledger is written internally by account_service.py (called from
    payment_service.py and commission_service.py) — there is no
    AccountCreate exposed here because nothing outside the backend
    should be inserting ledger rows directly. This is read-only from
    the API's perspective: AccountsLedger (admin, global) and per-party
    statement views (SupplierPayments.jsx, AgentSettlements.jsx,
    BuyerPayments.jsx) all just consume this.
    """
    model_config = ConfigDict(from_attributes=True)

    account_id: int
    party_id: int
    party_type: PartyTypeForMoney
    transaction_type: TransactionType
    description: Optional[str] = None
    debit_amount: Decimal
    credit_amount: Decimal
    running_balance: Decimal
    payment_id: Optional[int] = None
    order_id: Optional[int] = None
    created_at: datetime

    party_name: Optional[str] = None
