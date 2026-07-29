from decimal import Decimal
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.commission import Commission
from app.models.order import Order
from app.models.consignment import Consignment
from app.models.account import Account
from app.core.config import settings
from app.services.account_service import record_ledger_entry


async def get_commission(db: AsyncSession, commission_id: int) -> Commission:
    result = await db.execute(
        select(Commission).where(Commission.commission_id == commission_id)
    )
    commission = result.scalar_one_or_none()
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    return commission


async def commission_exists_for_order(db: AsyncSession, order_id: int) -> bool:
    """
    The source-of-truth check for "has a commission already been
    created for this order" — used instead of tracking a before/after
    status flag, since a flag snapshot can't see across multiple status
    toggles (completed -> pending -> completed would fool a flag, but
    not this direct DB check).
    """
    result = await db.execute(
        select(Commission.commission_id).where(Commission.order_id == order_id)
    )
    return result.scalar_one_or_none() is not None


async def create_commission_for_order(db: AsyncSession, order: Order) -> Commission:
    """
    Called by order_service.update_status when an order transitions to
    'completed'. Does NOT commit — part of the same transaction as the
    order status update.

    Uses the agent's own commission_rate set at consignment intake if
    present, otherwise falls back to settings.DEFAULT_COMMISSION_RATE.
    """
    result = await db.execute(
        select(Consignment).where(Consignment.consigned_id == order.consigned_id)
    )
    consignment = result.scalar_one()

    rate = consignment.commission_rate or Decimal(str(settings.DEFAULT_COMMISSION_RATE))
    amount = (order.total_amount * rate / Decimal("100")).quantize(Decimal("0.01"))

    commission = Commission(
        order_id=order.order_id,
        agent_id=consignment.agent_id,
        agent_type=consignment.agent_type,
        commission_rate=rate,
        commission_amount=amount,
    )
    db.add(commission)
    await db.flush()
    return commission


async def mark_commission_paid(db: AsyncSession, commission: Commission) -> None:
    """
    AgentCommissions.jsx 'mark as paid out' action. Writes the ledger
    entry that IS the source of truth for payout status — nothing is
    set directly on the commission row itself.
    """
    await record_ledger_entry(
        db,
        party_id=commission.agent_id,
        party_type=commission.agent_type,
        transaction_type="commission",
        credit_amount=commission.commission_amount,
        order_id=commission.order_id,
        description=f"Commission payout for order #{commission.order_id}",
    )
    await db.commit()


async def get_payout_status(db: AsyncSession, commission: Commission) -> str:
    """
    Derives payout_status for CommissionRead — 'pending' until a
    matching accounts row exists, 'reversed' if a follow-up refund
    entry exists against the same order for this agent, else 'paid'.
    """
    result = await db.execute(
        select(Account).where(
            Account.order_id == commission.order_id,
            Account.party_id == commission.agent_id,
            Account.party_type == commission.agent_type,
            Account.transaction_type == "commission",
        )
    )
    if not result.scalars().first():
        return "pending"

    result = await db.execute(
        select(Account).where(
            Account.order_id == commission.order_id,
            Account.party_id == commission.agent_id,
            Account.party_type == commission.agent_type,
            Account.transaction_type == "refund",
        )
    )
    if result.scalars().first():
        return "reversed"

    return "paid"


async def list_commissions_for_agent(db: AsyncSession, agent_id: int) -> List[Commission]:
    """AgentCommissions.jsx"""
    result = await db.execute(select(Commission).where(Commission.agent_id == agent_id))
    return result.scalars().all()