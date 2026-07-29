from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.consignment import Consignment
from app.models.party import Party
from app.schemas.consignment import ConsignmentCreate, ConsignmentStatusUpdate
from app.services.supply_service import get_supply, get_supply_for_update, deduct_stock


async def create_consignment(db: AsyncSession, agent: Party, data: ConsignmentCreate) -> Consignment:
    """
    AgentConsignmentIntake.jsx. This is the first of the two core
    workflow steps (the second is order_service.create_order).

    supplier_id/supplier_type are read off the selected supply, never
    accepted from the client — a request can't claim a supply it
    doesn't actually reference.
    """
    # locked fetch — holds the row until commit, so two agents can't
    # both pass the stock-availability check against the same supply
    # at the same time (see gap #4)
    supply = await get_supply_for_update(db, data.supply_id)

    # deduct_stock validates quantity <= current_stock and raises if not;
    # it does not commit, so this and the insert below are one transaction
    await deduct_stock(db, supply, data.quantity_consigned)

    consignment = Consignment(
        supply_id=supply.supply_id,
        supplier_id=supply.supplier_id,
        supplier_type=supply.supplier_type,
        agent_id=agent.party_id,
        agent_type=agent.party_type,
        payment_term=data.payment_term,
        quantity_consigned=data.quantity_consigned,
        selling_price_per_unit=data.selling_price_per_unit,
        commission_rate=data.commission_rate,
        quantity_remaining=data.quantity_consigned,
        status="pending",
    )
    db.add(consignment)
    await db.commit()
    await db.refresh(consignment)
    return consignment


async def get_consignment(db: AsyncSession, consigned_id: int) -> Consignment:
    result = await db.execute(
        select(Consignment).where(Consignment.consigned_id == consigned_id)
    )
    consignment = result.scalar_one_or_none()
    if not consignment:
        raise HTTPException(status_code=404, detail="Consignment not found")
    return consignment


async def get_consignment_for_update(db: AsyncSession, consigned_id: int) -> Consignment:
    """
    Same as get_consignment, but takes a row-level lock (SELECT ... FOR
    UPDATE). Use this ONLY right before deducting quantity_remaining
    (order_service.create_order) — two buyers ordering the same
    consignment at the same instant would otherwise both pass the
    availability check before either commits, overselling it.
    """
    result = await db.execute(
        select(Consignment)
        .where(Consignment.consigned_id == consigned_id)
        .with_for_update()
    )
    consignment = result.scalar_one_or_none()
    if not consignment:
        raise HTTPException(status_code=404, detail="Consignment not found")
    return consignment


async def list_consignments_for_agent(db: AsyncSession, agent_id: int) -> List[Consignment]:
    """AgentInventory.jsx — everything this agent currently manages."""
    result = await db.execute(
        select(Consignment).where(Consignment.agent_id == agent_id)
    )
    return result.scalars().all()


async def list_consignments_for_supplier(db: AsyncSession, supplier_id: int) -> List[Consignment]:
    """SupplierConsignments.jsx — history of handovers to agents."""
    result = await db.execute(
        select(Consignment).where(Consignment.supplier_id == supplier_id)
    )
    return result.scalars().all()


async def list_marketplace_consignments(db: AsyncSession) -> List[Consignment]:
    """
    BuyerMarketplace.jsx — only confirmed consignments with stock left
    are purchasable. 'pending' consignments haven't been accepted for
    sale yet, and 'cancelled'/'completed' have nothing left to sell.
    """
    result = await db.execute(
        select(Consignment).where(
            Consignment.status == "confirmed",
            Consignment.quantity_remaining > 0,
        )
    )
    return result.scalars().all()


async def update_status(
    db: AsyncSession, consigned_id: int, agent: Party, data: ConsignmentStatusUpdate
) -> Consignment:
    consignment = await get_consignment(db, consigned_id)
    if consignment.agent_id != agent.party_id:
        raise HTTPException(status_code=403, detail="This consignment does not belong to you")

    if data.status == "cancelled":
        if consignment.status in ("completed", "cancelled"):
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel a consignment that is already completed or cancelled",
            )
        # Return whatever is still unsold back to the supplier's stock.
        # quantity_sold (already bought by buyers) is NOT touched here —
        # only the unsold remainder goes back.
        supply = await get_supply(db, consignment.supply_id)
        supply.current_stock += consignment.quantity_remaining

    consignment.status = data.status
    await db.commit()
    await db.refresh(consignment)
    return consignment