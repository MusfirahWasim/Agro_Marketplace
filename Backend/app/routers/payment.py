from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent, get_current_user
from app.models.commission_agent import CommissionAgent
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentRead
from app.services import payment_service, receipt_service

router = APIRouter(prefix="/api/payments", tags=["Payments"])


async def _with_receipt_number(db: AsyncSession, payment):
    """
    receipt_number lives on Receipt, not Payment — every payment
    guarantees one exists (payment_service.create_payment creates it in
    the same transaction), so this is always resolvable.
    """
    receipt = await receipt_service.get_receipt_for_payment(db, payment.payment_id)
    payment.receipt_number = receipt.receipt_number
    return payment


@router.post("", response_model=PaymentRead, status_code=201)
async def create_payment(
    data: PaymentCreate,
    agent: CommissionAgent = Depends(get_current_agent),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentPayments.jsx — covers both buyer-pays-agent (FIFO-allocated
    against oldest unpaid sales) and agent-pays-supplier (simple debit).
    See payment_service.py for the full breakdown. A receipt is always
    generated alongside this, in the same transaction.

    NOTE: no ownership check that data.account_id belongs to one of
    this agent's own buyers/suppliers — payment_service.create_payment
    only rejects agent-owned accounts, it doesn't verify the account's
    buyer/supplier belongs to the caller. Worth tightening, same class
    of gap as commission.py's get_commission.
    """
    payment = await payment_service.create_payment(db, agent.agent_id, current_user.user_id, data)
    return await _with_receipt_number(db, payment)


@router.get("", response_model=List[PaymentRead])
async def list_payments(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentPayments.jsx — every payment this agent has personally recorded."""
    payments = await payment_service.list_payments_for_agent(db, agent.agent_id)
    for payment in payments:
        await _with_receipt_number(db, payment)
    return payments


@router.get("/account/{account_id}", response_model=List[PaymentRead])
async def list_payments_for_account(
    account_id: int,
    _agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentLedger.jsx — a given account's payment history. No explicit
    ownership check here either (same class of gap noted above) —
    account_id isn't verified against the caller's own buyers/suppliers.
    """
    payments = await payment_service.list_payments_for_account(db, account_id)
    for payment in payments:
        await _with_receipt_number(db, payment)
    return payments


@router.get("/{payment_id}", response_model=PaymentRead)
async def get_payment(
    payment_id: int,
    _agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    payment = await payment_service.get_payment(db, payment_id)
    return await _with_receipt_number(db, payment)
