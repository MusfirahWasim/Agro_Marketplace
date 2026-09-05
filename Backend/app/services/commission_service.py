from decimal import Decimal
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.commission import Commission
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.consignment import Consignment
from app.models.transaction import Transaction
from app.services.account_service import get_account, record_transaction


async def get_commission(db: AsyncSession, commission_id: int) -> Commission:
    result = await db.execute(select(Commission).where(Commission.commission_id == commission_id))
    commission = result.scalar_one_or_none()
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    return commission


async def commission_exists_for_sale_item(db: AsyncSession, sale_item_id: int) -> bool:
    """
    Source-of-truth existence check — used instead of a status flag, so
    a sale toggling completed -> pending -> completed can't trigger a
    duplicate commission. Same reasoning as v1, now keyed to
    sale_item_id per the project's schema fix.
    """
    result = await db.execute(
        select(Commission.commission_id).where(Commission.sale_item_id == sale_item_id)
    )
    return result.scalar_one_or_none() is not None


async def create_commission_for_sale_item(
    db: AsyncSession, sale_item: SaleItem, agent_id: int, created_by: int
) -> Commission:
    """
    Called by create_commissions_for_sale below. Does NOT commit — part
    of the same transaction as the sale's status update.

    Uses the CONSIGNMENT's commission_rate (set at intake — see
    consignment_service.create_consignment, which itself falls back to
    the agent's own default when not explicitly overridden), not a
    fresh lookup of the agent's current rate — the rate that applied
    when the consignment was taken in is what should apply here, even
    if the agent's default has since changed.

    Design decision resolving the payout_status open question (see
    schemas/commission.py): the commission credit is posted to the
    agent's OWN account immediately, in the same transaction as the
    commission row itself — there is no separate manual payout step,
    since the agent already holds buyer payments directly rather than
    waiting on a transfer. This means payout_status will, in practice,
    always read 'paid' the instant a commission exists; 'pending' is
    kept in the schema only for safety/future use, not because it's
    reachable under this flow.
    """
    result = await db.execute(
        select(Consignment).where(Consignment.consignment_id == sale_item.consignment_id)
    )
    consignment = result.scalar_one()

    rate = consignment.commission_rate
    amount = (sale_item.total_amount * rate / Decimal("100")).quantize(Decimal("0.01"))

    commission = Commission(
        sale_item_id=sale_item.sale_item_id,
        agent_id=agent_id,
        commission_rate=rate,
        commission_amount=amount,
    )
    db.add(commission)
    await db.flush()  # need commission.commission_id for the transaction reference below

    agent_account = await get_account(db, agent_id=agent_id)
    await record_transaction(
        db,
        account_id=agent_account.account_id,
        transaction_type="commission",
        description=f"Commission earned on sale item #{sale_item.sale_item_id}",
        created_by=created_by,
        credit_amount=amount,  # increases what's owed TO the agent (payable-style, like supplier)
        reference_type="commission",
        reference_id=commission.commission_id,
    )

    return commission


async def create_commissions_for_sale(db: AsyncSession, sale: Sale, created_by: int) -> List[Commission]:
    """
    Called by sale_service.update_status when a sale transitions to
    'completed'. Loops every sale_item on this sale, creates a
    commission for each that doesn't already have one, and updates
    sale.commission_amount to the sum — NOT sale.total_amount, which
    stays as the buyer-facing subtotal per the project's commission-
    agent business model assumption (commission comes out of the
    supplier settlement, not billed to the buyer).

    Does not commit — caller commits together with the sale status
    change, same convention as create_commission_for_sale_item.
    """
    items_result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale.sale_id))
    items = items_result.scalars().all()

    total_commission = Decimal("0.00")
    commissions = []

    for item in items:
        if await commission_exists_for_sale_item(db, item.sale_item_id):
            continue
        commission = await create_commission_for_sale_item(db, item, sale.agent_id, created_by)
        commissions.append(commission)
        total_commission += commission.commission_amount

    sale.commission_amount = total_commission
    return commissions


async def get_payout_status(db: AsyncSession, commission: Commission) -> str:
    """
    Derived from `transactions` — see the design decision in
    create_commission_for_sale_item. 'pending' if, for some reason, no
    posting transaction exists yet; 'reversed' if a later adjustment/
    refund transaction references this same commission_id; else 'paid'.
    """
    agent_account = await get_account(db, agent_id=commission.agent_id)

    posted_result = await db.execute(
        select(Transaction.transaction_id).where(
            Transaction.account_id == agent_account.account_id,
            Transaction.reference_type == "commission",
            Transaction.reference_id == commission.commission_id,
            Transaction.transaction_type == "commission",
        )
    )
    if posted_result.scalar_one_or_none() is None:
        return "pending"

    reversed_result = await db.execute(
        select(Transaction.transaction_id).where(
            Transaction.account_id == agent_account.account_id,
            Transaction.reference_type == "commission",
            Transaction.reference_id == commission.commission_id,
            Transaction.transaction_type == "adjustment",
        )
    )
    if reversed_result.scalar_one_or_none() is not None:
        return "reversed"

    return "paid"


async def list_commissions_for_agent(db: AsyncSession, agent_id: int) -> List[Commission]:
    """AgentCommissions.jsx"""
    result = await db.execute(select(Commission).where(Commission.agent_id == agent_id))
    return result.scalars().all()


async def list_all_commissions(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Commission]:
    """AdminCommissionsOverview.jsx"""
    result = await db.execute(select(Commission).offset(skip).limit(limit))
    return result.scalars().all()
