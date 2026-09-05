from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.consignment import Consignment
from app.models.supplier_supply import SupplierSupply
from app.models.commission_agent import CommissionAgent
from app.schemas.consignment import ConsignmentCreate, ConsignmentStatusUpdate
from app.services.supplier_supply_service import (
    get_supplier_supply,
    get_supplier_supply_for_update,
    deduct_stock,
)
from app.services.account_service import get_account, record_transaction


async def create_consignment(
    db: AsyncSession, agent_id: int, created_by: int, data: ConsignmentCreate
) -> Consignment:
    """
    AgentConsignmentIntake.jsx. supplier_id is read off the selected
    supplier_supply, never accepted from the client. Much simpler than
    v1 here — no supplier_type/agent_type aliasing needed since v2 has
    separate Supplier/CommissionAgent tables instead of one shared
    Party table.

    commission_rate falls back to the agent's own default
    (CommissionAgent.commission_rate) when not explicitly supplied.

    Also posts a 'purchase' transaction to the supplier's own account
    (credit — increases what the agent owes the supplier for this
    batch, using the supply's cost_per_unit) — this was missing
    entirely until account_service.py existed to post it through.

    NOTE: `transactions.reference_type` has no 'consignment'/'purchase'
    value in its enum (only sale/payment/refund/commission/manual) —
    reference_type/reference_id are left null here and the consignment
    is identified only in the free-text description instead. Flagging
    in case that enum should gain a value for this.

    created_by is the authenticated user's user_id, distinct from
    agent_id (commission_agents.agent_id) — see sale_service for the
    same distinction.
    """
    supply = await get_supplier_supply_for_update(db, data.supplier_supply_id)
    await deduct_stock(db, supply, data.quantity_consigned)  # does not commit

    commission_rate = data.commission_rate
    if commission_rate is None:
        agent_result = await db.execute(
            select(CommissionAgent.commission_rate).where(CommissionAgent.agent_id == agent_id)
        )
        commission_rate = agent_result.scalar_one()

    consignment = Consignment(
        supplier_supply_id=supply.supplier_supply_id,
        supplier_id=supply.supplier_id,
        agent_id=agent_id,
        quantity_consigned=data.quantity_consigned,
        selling_price_per_unit=data.selling_price_per_unit,
        commission_rate=commission_rate,
        payment_term=data.payment_term,
        status="pending",
    )
    db.add(consignment)
    await db.flush()  # need consignment.consignment_id for the transaction description

    supplier_account = await get_account(db, supplier_id=supply.supplier_id)
    purchase_amount = supply.cost_per_unit * data.quantity_consigned
    await record_transaction(
        db,
        account_id=supplier_account.account_id,
        transaction_type="purchase",
        description=f"Stock taken on consignment #{consignment.consignment_id}",
        created_by=created_by,
        credit_amount=purchase_amount,  # increases what the agent owes the supplier
    )

    await db.commit()
    await db.refresh(consignment)
    return consignment


async def get_consignment(db: AsyncSession, consignment_id: int) -> Consignment:
    result = await db.execute(
        select(Consignment).where(Consignment.consignment_id == consignment_id)
    )
    consignment = result.scalar_one_or_none()
    if not consignment:
        raise HTTPException(status_code=404, detail="Consignment not found")
    return consignment


async def get_consignment_for_update(db: AsyncSession, consignment_id: int) -> Consignment:
    """
    Row-level lock — use ONLY right before deducting quantity_sold
    (sale_service.create_sale), same reasoning as v1: two sales against
    the same consignment at the same instant would otherwise both pass
    the availability check before either commits.
    """
    result = await db.execute(
        select(Consignment)
        .where(Consignment.consignment_id == consignment_id)
        .with_for_update()
    )
    consignment = result.scalar_one_or_none()
    if not consignment:
        raise HTTPException(status_code=404, detail="Consignment not found")
    return consignment


async def list_consignments_for_agent(db: AsyncSession, agent_id: int) -> List[Consignment]:
    """AgentInventory.jsx — everything this agent currently manages."""
    result = await db.execute(select(Consignment).where(Consignment.agent_id == agent_id))
    return result.scalars().all()


async def list_consignments_for_supplier(db: AsyncSession, supplier_id: int) -> List[Consignment]:
    """AgentSuppliers.jsx detail view — a given supplier's consignment history."""
    result = await db.execute(select(Consignment).where(Consignment.supplier_id == supplier_id))
    return result.scalars().all()


async def list_available_consignments_for_agent(
    db: AsyncSession, agent_id: int
) -> List[Consignment]:
    """
    AgentCreateSale.jsx — the consignment picker. v1's marketplace
    equivalent doesn't exist in v2 since buyers never browse online;
    this serves the same purpose but for the agent building a sale.
    """
    result = await db.execute(
        select(Consignment).where(
            Consignment.agent_id == agent_id,
            Consignment.status == "confirmed",
        )
    )
    # quantity_remaining is not stored — filter in Python since it's
    # computed, not queryable as a column
    return [c for c in result.scalars().all() if (c.quantity_consigned - c.quantity_sold) > 0]


VALID_CONSIGNMENT_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


async def update_status(
    db: AsyncSession, consignment_id: int, agent_id: int, data: ConsignmentStatusUpdate
) -> Consignment:
    consignment = await get_consignment(db, consignment_id)
    if consignment.agent_id != agent_id:
        raise HTTPException(status_code=403, detail="This consignment does not belong to you")

    if data.status not in VALID_CONSIGNMENT_TRANSITIONS.get(consignment.status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change consignment status from '{consignment.status}' to '{data.status}'",
        )

    if data.status == "cancelled":
        # Return whatever is still unsold back to the supplier's stock.
        quantity_remaining = consignment.quantity_consigned - consignment.quantity_sold
        supply = await get_supplier_supply(db, consignment.supplier_supply_id)
        supply.quantity_available += quantity_remaining
        if supply.status == "depleted" and supply.quantity_available > 0:
            supply.status = "available"

    consignment.status = data.status
    await db.commit()
    await db.refresh(consignment)
    return consignment
