from typing import List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.consignment import Consignment
from app.schemas.sale import SaleCreate, SaleStatusUpdate
from app.services.consignment_service import get_consignment_for_update, get_consignment
from app.services.commission_service import create_commissions_for_sale
from app.services.account_service import get_account, record_transaction


async def create_sale(db: AsyncSession, agent_id: int, created_by: int, data: SaleCreate) -> Sale:
    """
    AgentCreateSale.jsx. Second of the two core workflow steps (the
    first is consignment_service.create_consignment) — now handles
    MULTIPLE line items per sale instead of v1's single-item order.

    rate_per_unit/line totals are computed here from each consignment's
    selling_price_per_unit, never accepted from the client — same rule
    v1 applied. Each referenced consignment is row-locked individually
    before its stock is checked/deducted, same reasoning as v1's
    single-consignment lock, just applied per item in sequence.

    ASSUMPTION (commission-agent business model): total_amount charged
    to the buyer equals the subtotal of what they're buying — the
    agent's commission is not an added buyer-side fee, it comes out of
    what's later settled with the supplier. commission_amount on this
    header stays 0 until the sale is marked 'completed' (see
    update_status below), same trigger-on-completion pattern v1 used.

    Also posts a 'sale' transaction to the BUYER's account (debit —
    increases what the buyer owes) once total_amount is known — this
    was missing entirely until account_service.py existed to post it
    through. This is also the debit that payment_service.py's FIFO
    allocation will later be paying down.

    created_by is the authenticated user's user_id, distinct from
    agent_id (commission_agents.agent_id).
    """
    sale = Sale(
        agent_id=agent_id,
        buyer_id=data.buyer_id,
        payment_term=data.payment_term,
        status="pending",
        payment_status="unpaid",
    )
    db.add(sale)
    await db.flush()  # need sale.sale_id before creating sale_items

    subtotal = Decimal("0.00")

    for item_data in data.items:
        consignment = await get_consignment_for_update(db, item_data.consignment_id)

        if consignment.status != "confirmed":
            raise HTTPException(
                status_code=400,
                detail=f"Consignment {consignment.consignment_id} is not available for sale",
            )

        quantity_remaining = consignment.quantity_consigned - consignment.quantity_sold
        if item_data.quantity > quantity_remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Requested quantity exceeds available stock for consignment {consignment.consignment_id}",
            )

        rate_per_unit = consignment.selling_price_per_unit
        line_total = rate_per_unit * item_data.quantity

        sale_item = SaleItem(
            sale_id=sale.sale_id,
            consignment_id=consignment.consignment_id,
            quantity=item_data.quantity,
            rate_per_unit=rate_per_unit,
            total_amount=line_total,
        )
        db.add(sale_item)

        consignment.quantity_sold += item_data.quantity
        if (consignment.quantity_consigned - consignment.quantity_sold) == 0:
            consignment.status = "completed"

        subtotal += line_total

    sale.subtotal = subtotal
    sale.total_amount = subtotal  # commission is not added on top — see docstring

    buyer_account = await get_account(db, buyer_id=data.buyer_id)
    await record_transaction(
        db,
        account_id=buyer_account.account_id,
        transaction_type="sale",
        description=f"Sale #{sale.sale_id}",
        created_by=created_by,
        debit_amount=sale.total_amount,  # increases what the buyer owes
        reference_type="sale",
        reference_id=sale.sale_id,
    )

    await db.commit()
    await db.refresh(sale)
    return sale


async def get_sale(db: AsyncSession, sale_id: int) -> Sale:
    result = await db.execute(select(Sale).where(Sale.sale_id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


async def list_sales_for_agent(db: AsyncSession, agent_id: int) -> List[Sale]:
    """AgentSales.jsx — sales this agent has created."""
    result = await db.execute(select(Sale).where(Sale.agent_id == agent_id))
    return result.scalars().all()


async def list_sales_for_buyer(db: AsyncSession, buyer_id: int) -> List[Sale]:
    """AgentLedger.jsx — a given buyer's sale history."""
    result = await db.execute(select(Sale).where(Sale.buyer_id == buyer_id))
    return result.scalars().all()


async def list_all_sales(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Sale]:
    """AdminSalesOverview.jsx — every sale in the system, unfiltered."""
    result = await db.execute(select(Sale).offset(skip).limit(limit))
    return result.scalars().all()


VALID_SALE_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


async def update_status(
    db: AsyncSession, sale_id: int, agent_id: int, created_by: int, data: SaleStatusUpdate
) -> Sale:
    """
    Transitioning to 'completed' creates one Commission row per
    sale_item via commission_service.create_commissions_for_sale, which
    also posts the earned amount straight to the agent's own account
    (see that function's docstring for why there's no separate payout
    step). Transitioning to 'cancelled' restores each item's quantity
    back to its consignment, reopening it if it had auto-completed from
    selling out — mirrors consignment_service.update_status's restore
    pattern.

    created_by is the authenticated user's user_id (NOT agent_id — the
    commission's ledger posting is recorded against users.user_id, a
    different id than commission_agents.agent_id) — the router supplies
    both from the same authenticated session.
    """
    sale = await get_sale(db, sale_id)
    if sale.agent_id != agent_id:
        raise HTTPException(status_code=403, detail="This sale does not belong to you")

    if data.status not in VALID_SALE_TRANSITIONS.get(sale.status, set()):
        if sale.status == "completed" and data.status == "cancelled":
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel a completed sale — process a refund instead",
            )
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change sale status from '{sale.status}' to '{data.status}'",
        )

    if data.status == "cancelled":
        items_result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale.sale_id))
        for item in items_result.scalars().all():
            consignment = await get_consignment(db, item.consignment_id)
            consignment.quantity_sold -= item.quantity
            if consignment.status == "completed":
                consignment.status = "confirmed"

        # Reverse the original 'sale' debit posted at creation — without
        # this, a cancelled sale would permanently inflate the buyer's
        # owed balance. Uses a credit (opposite side) rather than
        # deleting the original row, so the ledger keeps a full history
        # instead of silently erasing the original entry.
        buyer_account = await get_account(db, buyer_id=sale.buyer_id)
        await record_transaction(
            db,
            account_id=buyer_account.account_id,
            transaction_type="adjustment",
            description=f"Reversal — Sale #{sale.sale_id} cancelled",
            created_by=created_by,
            credit_amount=sale.total_amount,
            reference_type="sale",
            reference_id=sale.sale_id,
        )

    sale.status = data.status

    if data.status == "completed":
        await create_commissions_for_sale(db, sale, created_by)

    await db.commit()
    await db.refresh(sale)
    return sale
