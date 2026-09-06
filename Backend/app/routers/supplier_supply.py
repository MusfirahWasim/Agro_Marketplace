from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent
from app.models.commission_agent import CommissionAgent
from app.schemas.supplier_supply import (
    SupplierSupplyCreate,
    SupplierSupplyUpdate,
    SupplierSupplyRead,
)
from app.services import supplier_supply_service, supplier_service

router = APIRouter(prefix="/api/suppliers/{supplier_id}/supplies", tags=["Supplier Supplies"])


@router.post("", response_model=SupplierSupplyRead, status_code=201)
async def create_supplier_supply(
    supplier_id: int,
    data: SupplierSupplyCreate,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentSuppliers.jsx / AgentConsignmentIntake.jsx intake step. Ownership
    of the supplier is checked first (get_supplier raises 404 if it isn't
    this agent's), so a supply can't be recorded against a supplier that
    doesn't belong to the caller.
    """
    await supplier_service.get_supplier(db, supplier_id, agent.agent_id)
    return await supplier_supply_service.create_supplier_supply(db, supplier_id, data)


@router.get("", response_model=List[SupplierSupplyRead])
async def list_supplier_supplies(
    supplier_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentSuppliers.jsx detail view — a given supplier's intake history."""
    await supplier_service.get_supplier(db, supplier_id, agent.agent_id)
    return await supplier_supply_service.list_supplier_supplies(db, supplier_id)


@router.get("/{supplier_supply_id}", response_model=SupplierSupplyRead)
async def get_supplier_supply(
    supplier_id: int,
    supplier_supply_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    await supplier_service.get_supplier(db, supplier_id, agent.agent_id)
    return await supplier_supply_service.get_supplier_supply(db, supplier_supply_id)


@router.patch("/{supplier_supply_id}", response_model=SupplierSupplyRead)
async def update_supplier_supply(
    supplier_id: int,
    supplier_supply_id: int,
    data: SupplierSupplyUpdate,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    supplier_id in the path is used only for the ownership check above
    — the actual update goes through supplier_supply_service, which
    re-derives ownership via the supply's own linked supplier.agent_id
    (see that service's docstring).
    """
    await supplier_service.get_supplier(db, supplier_id, agent.agent_id)
    return await supplier_supply_service.update_supplier_supply(
        db, supplier_supply_id, agent.agent_id, data
    )
