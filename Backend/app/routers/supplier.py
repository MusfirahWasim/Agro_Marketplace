from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent
from app.models.commission_agent import CommissionAgent
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierRead
from app.services import supplier_service

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@router.post("", response_model=SupplierRead, status_code=201)
async def create_supplier(
    data: SupplierCreate,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentSuppliers.jsx — register a new supplier. Also creates their ledger Account (opening_balance=0)."""
    return await supplier_service.create_supplier(db, agent.agent_id, data)


@router.get("", response_model=List[SupplierRead])
async def list_suppliers(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """AgentSuppliers.jsx — scoped to this agent's own suppliers only."""
    return await supplier_service.list_suppliers(db, agent.agent_id, skip, limit)


@router.get("/{supplier_id}", response_model=SupplierRead)
async def get_supplier(
    supplier_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    return await supplier_service.get_supplier(db, supplier_id, agent.agent_id)


@router.patch("/{supplier_id}", response_model=SupplierRead)
async def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    return await supplier_service.update_supplier(db, supplier_id, agent.agent_id, data)
