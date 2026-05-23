from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from decimal import Decimal

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.payment import WalletTransaction
from app.schemas.wallet import TopUpRequest, WalletBalanceResponse, TransactionResponse
from app.utils.wallet import update_wallet_balance

router = APIRouter()

# ── GET /wallet/balance ───────────────────────────────────────────
@router.get("/balance", response_model=WalletBalanceResponse)
async def get_balance(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, current_user.id)
    return {"balance": float(user.wallet_balance)}


# ── GET /wallet/transactions ──────────────────────────────────────
@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(WalletTransaction)
        .where(WalletTransaction.user_id == current_user.id)
        .order_by(desc(WalletTransaction.created_at))
        .limit(50)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ── POST /wallet/topup ────────────────────────────────────────────
@router.post("/topup", response_model=WalletBalanceResponse)
async def top_up(
    body: TopUpRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.amount > 50000:
        raise HTTPException(400, "Maximum top-up is Rs. 50,000 per transaction")

    user = await db.get(User, current_user.id)
    new_balance = Decimal(str(user.wallet_balance)) + Decimal(str(body.amount))

    await update_wallet_balance(
        db=db,
        user_id=user.id,
        amount=Decimal(str(body.amount)),
        txn_type="topup",
        note="Simulated wallet top-up",
        new_balance=new_balance,
    )
    await db.commit()
    return {"balance": float(new_balance)}