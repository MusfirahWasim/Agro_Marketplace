from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent
from app.models.commission_agent import CommissionAgent
from app.schemas.receipt import ReceiptRead
from app.services import receipt_service

router = APIRouter(prefix="/api/receipts", tags=["Receipts"])


@router.get("", response_model=List[ReceiptRead])
async def list_receipts(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentReceipts.jsx — every receipt tied to a payment this agent recorded."""
    return await receipt_service.list_receipts_for_agent(db, agent.agent_id)


@router.get("/by-payment/{payment_id}", response_model=ReceiptRead)
async def get_receipt_by_payment(
    payment_id: int,
    _agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentPayments.jsx — jump straight from a payment record to its receipt."""
    return await receipt_service.get_receipt_for_payment(db, payment_id)


@router.get("/{receipt_id}", response_model=ReceiptRead)
async def get_receipt(
    receipt_id: int,
    _agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    No ownership check — same class of gap flagged in commission.py and
    payment.py (receipt_id isn't verified against the caller's own
    payments). Worth addressing together in one pass.
    """
    return await receipt_service.get_receipt(db, receipt_id)
