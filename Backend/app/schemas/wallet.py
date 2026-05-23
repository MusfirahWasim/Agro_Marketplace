from pydantic import BaseModel, condecimal
from typing import Optional
from datetime import datetime


class TopUpRequest(BaseModel):
    amount: condecimal(gt=0, max_digits=10, decimal_places=2)


class WalletBalanceResponse(BaseModel):
    balance: float


class TransactionResponse(BaseModel):
    id: int
    type: str           # credit | debit | topup
    amount: float
    balance_after: float
    note: Optional[str]
    booking_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True