from typing import Literal, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_party, require_admin
from app.models.party import Party
from app.schemas.party import PartyRead, PartyUpdate, PartyAdminUpdate, ChangePasswordRequest
from app.services import party_service

router = APIRouter(prefix="/api/parties", tags=["Parties"])


# --- Self-service — any authenticated party, acting on their own record ---

@router.get("/me", response_model=PartyRead)
async def get_my_profile(current_party: Party = Depends(get_current_party)):
    """Backs ProfileSettings.jsx for all 3 self-registering roles."""
    return current_party


@router.put("/me", response_model=PartyRead)
async def update_my_profile(
    data: PartyUpdate,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    return await party_service.update_profile(db, current_party, data)


@router.put("/me/password")
async def change_my_password(
    data: ChangePasswordRequest,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    await party_service.change_password(db, current_party, data)
    return {"message": "Password updated successfully"}


# --- Admin — AdminUsers.jsx ---

@router.get("/", response_model=list[PartyRead], dependencies=[Depends(require_admin)])
async def list_all_parties(
    party_type: Optional[Literal["S", "B", "CA", "A"]] = Query(
        None, description="Filter by role"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    return await party_service.list_parties(db, party_type, skip, limit)


@router.get(
    "/{party_type}/{party_id}",
    response_model=PartyRead,
    dependencies=[Depends(require_admin)],
)
async def get_party_by_id(
    party_type: Literal["S", "B", "CA", "A"],
    party_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await party_service.get_party(db, party_id, party_type)


@router.patch(
    "/{party_type}/{party_id}",
    response_model=PartyRead,
    dependencies=[Depends(require_admin)],
)
async def admin_update_party(
    party_type: Literal["S", "B", "CA", "A"],
    party_id: int,
    data: PartyAdminUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Activate/deactivate an account, or adjust its credit limit."""
    return await party_service.admin_update_party(db, party_id, party_type, data)