from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.supplier_supply import SupplierSupply
from app.schemas.supplier_supply import SupplierSupplyCreate, SupplierSupplyUpdate


async def create_supplier_supply(
    db: AsyncSession, supplier_id: int, data: SupplierSupplyCreate
) -> SupplierSupply:
    """
    Recorded BY the agent on the supplier's behalf (the supplier never
    logs in) — supplier_id is passed in explicitly by the router rather
    than pulled off an authenticated party, unlike v1 where supplier_id/
    supplier_type came straight from the logged-in supplier.
    """
    supply = SupplierSupply(supplier_id=supplier_id, **data.model_dump())
    db.add(supply)
    await db.commit()
    await db.refresh(supply)
    return supply


async def get_supplier_supply(db: AsyncSession, supplier_supply_id: int) -> SupplierSupply:
    result = await db.execute(
        select(SupplierSupply).where(SupplierSupply.supplier_supply_id == supplier_supply_id)
    )
    supply = result.scalar_one_or_none()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return supply


async def get_supplier_supply_for_update(
    db: AsyncSession, supplier_supply_id: int
) -> SupplierSupply:
    """
    Row-level lock (SELECT ... FOR UPDATE), same pattern as v1 — use
    ONLY right before deducting stock (consignment_service.create_consignment),
    never for plain reads.
    """
    result = await db.execute(
        select(SupplierSupply)
        .where(SupplierSupply.supplier_supply_id == supplier_supply_id)
        .with_for_update()
    )
    supply = result.scalar_one_or_none()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return supply


async def list_supplier_supplies(db: AsyncSession, supplier_id: int) -> List[SupplierSupply]:
    """AgentSuppliers.jsx — a given supplier's intake history."""
    result = await db.execute(
        select(SupplierSupply).where(SupplierSupply.supplier_id == supplier_id)
    )
    return result.scalars().all()


async def list_available_supplies_for_agent(
    db: AsyncSession, agent_id: int
) -> List[SupplierSupply]:
    """
    AgentConsignmentIntake.jsx — the supply picker, scoped to this
    agent's own suppliers (via SupplierSupply.supplier.agent_id) rather
    than v1's single-supplier-at-a-time picker, since one agent may
    have several suppliers to choose from.
    """
    result = await db.execute(
        select(SupplierSupply)
        .join(SupplierSupply.supplier)
        .where(
            SupplierSupply.supplier.has(agent_id=agent_id),
            SupplierSupply.status == "available",
            SupplierSupply.quantity_available > 0,
        )
    )
    return result.scalars().all()


async def update_supplier_supply(
    db: AsyncSession, supplier_supply_id: int, agent_id: int, data: SupplierSupplyUpdate
) -> SupplierSupply:
    """
    Ownership check goes through the linked supplier's agent_id, since
    SupplierSupply itself has no agent_id column — mirrors how v1
    checked supply.supplier_id against the caller's party_id, just one
    hop further through the relationship.
    """
    supply = await get_supplier_supply(db, supplier_supply_id)
    if supply.supplier.agent_id != agent_id:
        raise HTTPException(status_code=403, detail="This supply does not belong to your supplier")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supply, field, value)
    await db.commit()
    await db.refresh(supply)
    return supply


async def deduct_stock(db: AsyncSession, supply: SupplierSupply, quantity) -> None:
    """
    Called by consignment_service.create_consignment. Does NOT commit —
    caller commits once, together with the new consignment row, so the
    deduction and the consignment succeed or fail as a single
    transaction (same rule as v1).

    v1 also auto-deleted supplies at zero stock implicitly via
    current_stock reaching 0; v2 has an explicit status enum instead —
    this sets status='depleted' when quantity_available hits 0, rather
    than v1 having no equivalent state to set.
    """
    if quantity > supply.quantity_available:
        raise HTTPException(
            status_code=400, detail="Requested quantity exceeds available stock"
        )
    supply.quantity_available -= quantity
    if supply.quantity_available == 0:
        supply.status = "depleted"
