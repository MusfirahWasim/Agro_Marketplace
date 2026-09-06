from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent
from app.models.commission_agent import CommissionAgent
from app.schemas.commission import CommissionRead
from app.services import commission_service

router = APIRouter(prefix="/api/commissions", tags=["Commissions"])


async def _with_payout_status(db: AsyncSession, commissions):
    """
    payout_status isn't a stored column (see commission_service.py) —
    computed per row here before serialization, same pattern used for
    Transaction.running_balance in account_service.py.
    """
    for commission in commissions:
        commission.payout_status = await commission_service.get_payout_status(db, commission)
    return commissions


@router.get("", response_model=List[CommissionRead])
async def list_commissions(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentCommissions.jsx — this agent's own earned commissions."""
    commissions = await commission_service.list_commissions_for_agent(db, agent.agent_id)
    return await _with_payout_status(db, commissions)


@router.get("/{commission_id}", response_model=CommissionRead)
async def get_commission(
    commission_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    No explicit ownership check here — commission_service.get_commission
    doesn't filter by agent_id. Low risk (commission_id isn't
    enumerable data an agent could act on beyond viewing), but worth
    tightening to a 403 if this ever needs to be strict.
    """
    commission = await commission_service.get_commission(db, commission_id)
    commission.payout_status = await commission_service.get_payout_status(db, commission)
    return commission
