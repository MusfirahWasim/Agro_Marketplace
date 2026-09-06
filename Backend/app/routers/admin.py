from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.schemas.user import UserRead, UserAdminUpdate
from app.services import admin_service

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

# NOTE: no schemas/admin.py exists yet for the dashboard response — it
# stays a plain dict, same as v1. Worth adding a DashboardStats schema
# once the frontend knows exactly what shape AdminDashboard.jsx needs.


@router.get("/dashboard")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    AdminDashboard.jsx — system-wide totals. Admin never touches
    individual transactions (per the project's core design), so
    everything here is read-only aggregates. The "pending" count inside
    agents also IS the notification badge (see project decision: no
    persisted notifications table, just a live count on read).
    """
    return await admin_service.get_dashboard_stats(db)


@router.get("/agents", response_model=List[UserRead])
async def list_agents(db: AsyncSession = Depends(get_db)):
    """AdminAgents.jsx — full agent list, active and inactive together."""
    return await admin_service.list_agents(db)


@router.get("/agents/pending", response_model=List[UserRead])
async def list_pending_agents(db: AsyncSession = Depends(get_db)):
    """AdminAgents.jsx — agents awaiting approval specifically."""
    return await admin_service.list_pending_agents(db)


@router.post("/agents/{user_id}/approve", response_model=UserRead)
async def approve_agent(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Flips active_status True — the agent's CommissionAgent profile and
    ledger Account already exist from signup, nothing else to create.
    """
    return await admin_service.approve_agent(db, user_id)


@router.delete("/agents/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_agent(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Deletes the agent outright (design decision — see admin_service.py):
    active_status alone can't distinguish "rejected" from "still
    pending", so rejecting has to mean removal for the distinction to
    be meaningful. Only valid for agents not yet approved.
    """
    await admin_service.reject_agent(db, user_id)


@router.patch("/agents/{user_id}/status", response_model=UserRead)
async def set_agent_active_status(
    user_id: int, data: UserAdminUpdate, db: AsyncSession = Depends(get_db)
):
    """
    Suspend/reinstate an ALREADY-APPROVED agent — distinct from
    reject_agent above, which only applies to pending signups.
    """
    if data.active_status is None:
        raise HTTPException(status_code=400, detail="active_status is required")
    return await admin_service.set_agent_active_status(db, user_id, data.active_status)
