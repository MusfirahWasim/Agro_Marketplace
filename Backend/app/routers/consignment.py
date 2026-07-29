from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_party, require_agent, require_supplier
from app.models.party import Party
from app.schemas.consignment import ConsignmentCreate, ConsignmentStatusUpdate, ConsignmentRead
from app.services import consignment_service

router = APIRouter(prefix="/api/consignments", tags=["Consignments"])


# NOTE: same route-ordering concern as supplies.py — /me, /supplier/me,
# and /marketplace must come BEFORE /{consigned_id}.

@router.post("/", response_model=ConsignmentRead, status_code=status.HTTP_201_CREATED)
async def create_consignment(
    data: ConsignmentCreate,
    agent: Party = Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentConsignmentIntake.jsx. supplier_id/supplier_type are derived
    server-side (see consignment_service) from the selected supply —
    never trusted from the request body.
    """
    return await consignment_service.create_consignment(db, agent, data)


@router.get("/me", response_model=List[ConsignmentRead])
async def list_my_consignments(
    agent: Party = Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentInventory.jsx — everything this agent currently manages."""
    return await consignment_service.list_consignments_for_agent(db, agent.party_id)


@router.get("/supplier/me", response_model=List[ConsignmentRead])
async def list_my_consignment_history(
    supplier: Party = Depends(require_supplier),
    db: AsyncSession = Depends(get_db),
):
    """SupplierConsignments.jsx — history of handovers to agents."""
    return await consignment_service.list_consignments_for_supplier(db, supplier.party_id)


@router.get("/marketplace", response_model=List[ConsignmentRead])
async def browse_marketplace(
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    BuyerMarketplace.jsx — only confirmed consignments with stock left
    are shown. Open to any authenticated party, not just buyers, in
    case agents/admins want to preview the live marketplace too.
    """
    return await consignment_service.list_marketplace_consignments(db)


@router.get("/{consigned_id}", response_model=ConsignmentRead)
async def get_consignment(
    consigned_id: int,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """BuyerProductDetail.jsx"""
    return await consignment_service.get_consignment(db, consigned_id)


@router.patch("/{consigned_id}/status", response_model=ConsignmentRead)
async def update_consignment_status(
    consigned_id: int,
    data: ConsignmentStatusUpdate,
    agent: Party = Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Ownership is checked inside consignment_service — raises 403 if
    this isn't the agent's own consignment. Cancelling restores unsold
    stock to the supplier; nothing sold moves consignments to
    'completed' automatically elsewhere (see order_service).
    """
    return await consignment_service.update_status(db, consigned_id, agent, data)
