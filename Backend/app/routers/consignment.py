from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent, get_current_user
from app.models.commission_agent import CommissionAgent
from app.models.user import User
from app.schemas.consignment import ConsignmentCreate, ConsignmentStatusUpdate, ConsignmentRead
from app.services import consignment_service

router = APIRouter(prefix="/api/consignments", tags=["Consignments"])


@router.post("", response_model=ConsignmentRead, status_code=201)
async def create_consignment(
    data: ConsignmentCreate,
    agent: CommissionAgent = Depends(get_current_agent),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentConsignmentIntake.jsx. Also posts a 'purchase' credit to the
    supplier's account (see consignment_service.py) — created_by is
    the authenticated user_id, distinct from agent.agent_id.
    """
    return await consignment_service.create_consignment(
        db, agent.agent_id, current_user.user_id, data
    )


@router.get("", response_model=List[ConsignmentRead])
async def list_consignments(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentInventory.jsx — everything this agent currently manages."""
    return await consignment_service.list_consignments_for_agent(db, agent.agent_id)


@router.get("/available", response_model=List[ConsignmentRead])
async def list_available_consignments(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentCreateSale.jsx — the consignment picker (confirmed status, stock remaining)."""
    return await consignment_service.list_available_consignments_for_agent(db, agent.agent_id)


@router.get("/{consignment_id}", response_model=ConsignmentRead)
async def get_consignment(
    consignment_id: int,
    db: AsyncSession = Depends(get_db),
    _agent: CommissionAgent = Depends(get_current_agent),
):
    return await consignment_service.get_consignment(db, consignment_id)


@router.patch("/{consignment_id}/status", response_model=ConsignmentRead)
async def update_consignment_status(
    consignment_id: int,
    data: ConsignmentStatusUpdate,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Ownership is enforced inside consignment_service.update_status
    itself (403 if this consignment isn't the caller's).
    """
    return await consignment_service.update_status(db, consignment_id, agent.agent_id, data)
