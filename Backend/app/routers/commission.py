from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_agent, get_current_party
from app.models.party import Party
from app.schemas.commission import CommissionRead
from app.services import commission_service

router = APIRouter(prefix="/api/commissions", tags=["Commissions"])


@router.get("/me", response_model=List[CommissionRead])
async def list_my_commissions(
    agent: Party = Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentCommissions.jsx. NOTE: payout_status is computed per row via
    one extra query each (N+1) — acceptable at MVP scale, but worth
    batching into a single query if an agent's commission list ever
    gets large.
    """
    commissions = await commission_service.list_commissions_for_agent(db, agent.party_id)

    results = []
    for commission in commissions:
        payout_status = await commission_service.get_payout_status(db, commission)
        result = CommissionRead.model_validate(commission)
        result.payout_status = payout_status
        results.append(result)
    return results


@router.post("/{commission_id}/mark-paid", response_model=CommissionRead)
async def mark_commission_paid(
    commission_id: int,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    Writes the ledger entry that makes this commission 'paid' (per our
    decision, payout status is derived from `accounts`, never stored
    directly on `commissions`). Only the owning agent or an admin can
    do this.
    """
    commission = await commission_service.get_commission(db, commission_id)

    is_owner = (
        current_party.party_type == "CA" and current_party.party_id == commission.agent_id
    )
    is_admin = current_party.party_type == "A"
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="You do not have access to this commission")

    await commission_service.mark_commission_paid(db, commission)

    payout_status = await commission_service.get_payout_status(db, commission)
    result = CommissionRead.model_validate(commission)
    result.payout_status = payout_status
    return result
