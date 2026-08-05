from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import aliased
from fastapi import HTTPException

from app.models.consignment import Consignment
from app.models.party import Party
from app.models.supply import Supply
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
    """
    BuyerProductDetail.jsx, plus internal ownership checks elsewhere in
    this file. Joins Supply (item_name, category, unit, description) and
    Party TWICE — once for the agent, once for the supplier, since both
    are Party rows and a single join can't distinguish them — hence
    aliased(). Sets results as plain attributes on the ORM object, same
    pattern as list_marketplace_consignments.
    """
    AgentParty = aliased(Party)
    SupplierParty = aliased(Party)

    result = await db.execute(
        select(
            Consignment,
            Supply.item_name,
            Supply.category,
            Supply.unit,
            Supply.description,
            AgentParty.name,
            SupplierParty.name,
        )
        .join(Supply, Consignment.supply_id == Supply.supply_id)
        .join(
            AgentParty,
            and_(Consignment.agent_id == AgentParty.party_id, Consignment.agent_type == AgentParty.party_type),
        )
        .join(
            SupplierParty,
            and_(
                Consignment.supplier_id == SupplierParty.party_id,
                Consignment.supplier_type == SupplierParty.party_type,
            ),
        )
        .where(Consignment.consigned_id == consigned_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Consignment not found")

    consignment, item_name, category, unit, description, agent_name, supplier_name = row
    consignment.item_name = item_name
    consignment.category = category
    consignment.unit = unit
    consignment.description = description
    consignment.agent_name = agent_name
    consignment.supplier_name = supplier_name
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

    Joins Supply (item_name, category, unit) and Party (agent_name) so
    ConsignmentRead's denormalized fields are actually populated —
    previously this just returned the raw row and those came back null.
    Sets them as plain attributes on the ORM object post-query; Pydantic's
    from_attributes reads them the same as a real mapped column.
    """
    result = await db.execute(
        select(Consignment, Supply.item_name, Supply.category, Supply.unit, Party.name)
        .join(Supply, Consignment.supply_id == Supply.supply_id)
        .join(
            Party,
            and_(Consignment.agent_id == Party.party_id, Consignment.agent_type == Party.party_type),
        )
        .where(
            Consignment.status == "confirmed",
            Consignment.quantity_remaining > 0,
        )
    )

    consignments = []
    for consignment, item_name, category, unit, agent_name in result.all():
        consignment.item_name = item_name
        consignment.category = category
        consignment.unit = unit
        consignment.agent_name = agent_name
        consignments.append(consignment)
    return consignments


# Explicit state machine — completed/cancelled are terminal (no
# transitions out of them). This replaces the earlier narrower guard
# that only checked the 'cancelled' target specifically; now ANY
# invalid transition (e.g. pending -> completed directly, skipping
# confirmation) is rejected, not just re-cancelling.
VALID_CONSIGNMENT_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


async def update_status(
    db: AsyncSession, consigned_id: int, agent: Party, data: ConsignmentStatusUpdate
) -> Consignment:
    consignment = await get_consignment(db, consigned_id)
    if consignment.agent_id != agent.party_id:
        raise HTTPException(status_code=403, detail="This consignment does not belong to you")

    if data.status not in VALID_CONSIGNMENT_TRANSITIONS.get(consignment.status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change consignment status from '{consignment.status}' to '{data.status}'",
        )

    if data.status == "cancelled":
        # Return whatever is still unsold back to the supplier's stock.
        # quantity_sold (already bought by buyers) is NOT touched here —
        # only the unsold remainder goes back.
        supply = await get_supply(db, consignment.supply_id)
        supply.current_stock += consignment.quantity_remaining

    consignment.status = data.status
    await db.commit()
    await db.refresh(consignment)
    return consignment