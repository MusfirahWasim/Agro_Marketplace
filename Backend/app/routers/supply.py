from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_party, require_supplier
from app.models.party import Party
from app.schemas.supply import SupplyCreate, SupplyUpdate, SupplyRead
from app.services import supply_service

router = APIRouter(prefix="/api/supplies", tags=["Supplies"])


# NOTE: route ordering matters here — /me, /categories, and
# /available/{supplier_id} must be declared BEFORE /{supply_id}, or
# FastAPI will try to match "me"/"categories" as a supply_id path
# param and 422 on the int conversion.

@router.post("/", response_model=SupplyRead, status_code=status.HTTP_201_CREATED)
async def create_supply(
    data: SupplyCreate,
    supplier: Party = Depends(require_supplier),
    db: AsyncSession = Depends(get_db),
):
    return await supply_service.create_supply(db, supplier, data)


@router.get("/me", response_model=List[SupplyRead])
async def list_my_supplies(
    supplier: Party = Depends(require_supplier),
    db: AsyncSession = Depends(get_db),
):
    """SupplierSupplies.jsx — a supplier's own inventory list."""
    return await supply_service.list_supplies_for_supplier(db, supplier.party_id)


@router.get("/categories", response_model=List[str])
async def list_categories(
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """BuyerMarketplace.jsx category filter pills — distinct values in use."""
    return await supply_service.list_categories(db)


@router.get("/available/{supplier_id}", response_model=List[SupplyRead])
async def list_available_supplies(
    supplier_id: int,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentConsignmentIntake.jsx — the supply picker dropdown for a given
    supplier, showing only supplies with stock left to consign.
    """
    return await supply_service.list_available_supplies_for_agent(db, supplier_id)


@router.get("/{supply_id}", response_model=SupplyRead)
async def get_supply(
    supply_id: int,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    return await supply_service.get_supply(db, supply_id)


@router.put("/{supply_id}", response_model=SupplyRead)
async def update_supply(
    supply_id: int,
    data: SupplyUpdate,
    supplier: Party = Depends(require_supplier),
    db: AsyncSession = Depends(get_db),
):
    """Ownership is checked inside supply_service — raises 403 if this isn't the supplier's own supply."""
    return await supply_service.update_supply(db, supply_id, supplier, data)


@router.delete("/{supply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supply(
    supply_id: int,
    supplier: Party = Depends(require_supplier),
    db: AsyncSession = Depends(get_db),
):
    await supply_service.delete_supply(db, supply_id, supplier)
