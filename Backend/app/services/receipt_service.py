from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.receipt import Receipt
from app.models.payment import Payment


async def create_receipt_for_payment(
    db: AsyncSession, payment: Payment, created_by: int, description: Optional[str] = None
) -> Receipt:
    """
    Called by payment_service.create_payment right after the payment is
    flushed (payment.payment_id must already exist). Does NOT commit —
    part of the same transaction as the payment and its ledger postings.

    receipt_number format is f"RCPT-{receipt_id:06d}" (per project
    decision) — this requires the row's own auto-increment PK first, so
    the insert happens in two steps: flush to get receipt_id, then
    set receipt_number and flush again.
    """
    receipt = Receipt(
        receipt_number="",  # placeholder, set once receipt_id is known
        payment_id=payment.payment_id,
        amount=payment.amount_paid,
        description=description,
        created_by=created_by,
    )
    db.add(receipt)
    await db.flush()  # assigns receipt.receipt_id

    receipt.receipt_number = f"RCPT-{receipt.receipt_id:06d}"
    await db.flush()

    return receipt


async def get_receipt(db: AsyncSession, receipt_id: int) -> Receipt:
    result = await db.execute(select(Receipt).where(Receipt.receipt_id == receipt_id))
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


async def get_receipt_for_payment(db: AsyncSession, payment_id: int) -> Receipt:
    result = await db.execute(select(Receipt).where(Receipt.payment_id == payment_id))
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found for this payment")
    return receipt


async def list_receipts_for_agent(db: AsyncSession, agent_id: int) -> List[Receipt]:
    """
    AgentReceipts.jsx — joins through Payment since Receipt itself has
    no agent_id column (only payment_id).
    """
    result = await db.execute(
        select(Receipt).join(Payment, Receipt.payment_id == Payment.payment_id).where(
            Payment.agent_id == agent_id
        )
    )
    return result.scalars().all()
