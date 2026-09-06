from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent
from app.models.commission_agent import CommissionAgent
from app.schemas.buyer import BuyerCreate, BuyerUpdate, BuyerRead
from app.services import buyer_service

router = APIRouter(prefix="/api/buyers", tags=["Buyers"])


@router.post("", response_model=BuyerRead, status_code=201)
async def create_buyer(
    data: BuyerCreate,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentBuyers.jsx — register a new buyer. Also creates their ledger Account (opening_balance=0)."""
    return await buyer_service.create_buyer(db, agent.agent_id, data)


@router.get("", response_model=List[BuyerRead])
async def list_buyers(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """AgentBuyers.jsx — scoped to this agent's own buyers only."""
    return await buyer_service.list_buyers(db, agent.agent_id, skip, limit)


@router.get("/{buyer_id}", response_model=BuyerRead)
async def get_buyer(
    buyer_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    return await buyer_service.get_buyer(db, buyer_id, agent.agent_id)


@router.patch("/{buyer_id}", response_model=BuyerRead)
async def update_buyer(
    buyer_id: int,
    data: BuyerUpdate,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    return await buyer_service.update_buyer(db, buyer_id, agent.agent_id, data)
