from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct
from fastapi import HTTPException

from app.models.supply import Supply
from app.models.party import Party
from app.schemas.supply import SupplyCreate, SupplyUpdate


async def create_supply(db: AsyncSession, supplier: Party, data: SupplyCreate) -> Supply:
    supply = Supply(
        supplier_id=supplier.party_id,
        supplier_type=supplier.party_type,
        **data.model_dump(),
    )
    db.add(supply)
    await db.commit()
    await db.refresh(supply)
    return supply


async def get_supply(db: AsyncSession, supply_id: int) -> Supply:
    result = await db.execute(select(Supply).where(Supply.supply_id == supply_id))
    supply = result.scalar_one_or_none()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return supply


async def get_supply_for_update(db: AsyncSession, supply_id: int) -> Supply:
    """
    Same as get_supply, but takes a row-level lock (SELECT ... FOR
    UPDATE) so a concurrent request touching the same supply has to
    wait until this transaction commits or rolls back. Use this ONLY
    right before deducting stock (consignment_service.create_consignment)
    — using it for plain reads would serialize requests for no benefit.
    """
    result = await db.execute(
        select(Supply).where(Supply.supply_id == supply_id).with_for_update()
    )
    supply = result.scalar_one_or_none()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return supply


async def list_supplies_for_supplier(db: AsyncSession, supplier_id: int) -> List[Supply]:
    """SupplierSupplies.jsx — a supplier's own inventory list."""
    result = await db.execute(select(Supply).where(Supply.supplier_id == supplier_id))
    return result.scalars().all()


async def list_available_supplies_for_agent(db: AsyncSession, supplier_id: int) -> List[Supply]:
    """
    AgentConsignmentIntake.jsx — the supply picker dropdown. Only shows
    supplies with stock left to consign.
    """
    result = await db.execute(
        select(Supply).where(Supply.supplier_id == supplier_id, Supply.current_stock > 0)
    )
    return result.scalars().all()


async def update_supply(
    db: AsyncSession, supply_id: int, supplier: Party, data: SupplyUpdate
) -> Supply:
    supply = await get_supply(db, supply_id)
    if supply.supplier_id != supplier.party_id:
        raise HTTPException(status_code=403, detail="This supply does not belong to you")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supply, field, value)
    await db.commit()
    await db.refresh(supply)
    return supply


async def delete_supply(db: AsyncSession, supply_id: int, supplier: Party) -> None:
    supply = await get_supply(db, supply_id)
    if supply.supplier_id != supplier.party_id:
        raise HTTPException(status_code=403, detail="This supply does not belong to you")
    await db.delete(supply)
    await db.commit()


async def list_categories(db: AsyncSession) -> List[str]:
    """BuyerMarketplace.jsx category filter — distinct values in use."""
    result = await db.execute(select(distinct(Supply.category)))
    return [row[0] for row in result.all()]


async def deduct_stock(db: AsyncSession, supply: Supply, quantity: int) -> None:
    """
    Called by consignment_service.create_consignment — reduces the
    supplier's available stock when an agent takes a consignment.

    Does NOT commit. The caller (consignment_service) commits once,
    together with the new consignment row, so the stock deduction and
    the consignment creation succeed or fail as a single transaction.
    """
    if quantity > supply.current_stock:
        raise HTTPException(
            status_code=400, detail="Requested quantity exceeds available stock"
        )
    supply.current_stock -= quantity