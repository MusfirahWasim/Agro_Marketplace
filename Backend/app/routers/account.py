from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_party, require_admin
from app.models.party import Party
from app.schemas.account import AccountRead
from app.services import account_service

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@router.get("/me", response_model=List[AccountRead])
async def get_my_ledger(
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    Powers SupplierPayments.jsx, AgentSettlements.jsx, and
    BuyerPayments.jsx — each just reads their own party's ledger.
    """
    return await account_service.list_ledger_for_party(
        db, current_party.party_id, current_party.party_type
    )


@router.get("/", response_model=List[AccountRead], dependencies=[Depends(require_admin)])
async def get_all_ledger_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """AdminAccountsLedger.jsx — the full, unfiltered ledger across every party."""
    return await account_service.list_all_ledger_entries(db, skip, limit)