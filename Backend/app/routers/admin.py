from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.services import admin_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# NOTE: no schemas/admin.py exists yet — the dashboard response below
# is a plain dict, not a typed response_model. Worth adding a
# DashboardStats schema once the frontend knows exactly what shape it needs.


@router.get("/dashboard", dependencies=[Depends(require_admin)])
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """AdminDashboard.jsx — system-wide totals across all four roles."""
    return await admin_service.get_dashboard_stats(db)