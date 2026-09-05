from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.supplier import Supplier
from app.models.account import Account
from app.schemas.supplier import SupplierCreate, SupplierUpdate


async def create_supplier(db: AsyncSession, agent_id: int, data: SupplierCreate) -> Supplier:
    """
    Mirrors buyer_service.create_buyer — suppliers are registered BY
    the agent and get their own ledger Account created in the same
    flow (opening_balance = 0; same open note as buyers about whether
    an onboarding balance should be settable).
    """
    supplier = Supplier(agent_id=agent_id, **data.model_dump())
    db.add(supplier)
    await db.flush()

    account = Account(supplier_id=supplier.supplier_id, opening_balance=0)
    db.add(account)

    await db.commit()
    await db.refresh(supplier)
    return supplier


async def get_supplier(
    db: AsyncSession, supplier_id: int, agent_id: Optional[int] = None
) -> Supplier:
    query = select(Supplier).where(Supplier.supplier_id == supplier_id)
    if agent_id is not None:
        query = query.where(Supplier.agent_id == agent_id)
    result = await db.execute(query)
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


async def list_suppliers(
    db: AsyncSession, agent_id: Optional[int] = None, skip: int = 0, limit: int = 100
) -> List[Supplier]:
    query = select(Supplier)
    if agent_id is not None:
        query = query.where(Supplier.agent_id == agent_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def update_supplier(
    db: AsyncSession, supplier_id: int, agent_id: int, data: SupplierUpdate
) -> Supplier:
    supplier = await get_supplier(db, supplier_id, agent_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    await db.commit()
    await db.refresh(supplier)
    return supplier
