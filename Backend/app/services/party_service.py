from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.party import Party
from app.schemas.party import PartyUpdate, PartyAdminUpdate, ChangePasswordRequest
from app.core.security import verify_password, get_password_hash


async def get_party(db: AsyncSession, party_id: int, party_type: str) -> Party:
    result = await db.execute(
        select(Party).where(Party.party_id == party_id, Party.party_type == party_type)
    )
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


async def update_profile(db: AsyncSession, party: Party, data: PartyUpdate) -> Party:
    """Self-service update — used by ProfileSettings.jsx for all 3 self-registering roles."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(party, field, value)
    await db.commit()
    await db.refresh(party)
    return party


async def change_password(db: AsyncSession, party: Party, data: ChangePasswordRequest) -> None:
    if not party.password_hash or not verify_password(
        data.current_password, party.password_hash
    ):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    party.password_hash = get_password_hash(data.new_password)
    await db.commit()


async def list_parties(db: AsyncSession, party_type: Optional[str] = None) -> List[Party]:
    """Admin: AdminUsers.jsx — list all parties, optionally filtered by role."""
    query = select(Party)
    if party_type:
        query = query.where(Party.party_type == party_type)
    result = await db.execute(query)
    return result.scalars().all()


async def admin_update_party(
    db: AsyncSession, party_id: int, party_type: str, data: PartyAdminUpdate
) -> Party:
    """Admin-only — activate/deactivate accounts, adjust credit limits."""
    party = await get_party(db, party_id, party_type)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(party, field, value)
    await db.commit()
    await db.refresh(party)
    return party
