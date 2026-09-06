from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent
from app.models.commission_agent import CommissionAgent
from app.schemas.account import AccountRead
from app.schemas.transaction import TransactionRead
from app.services import account_service, buyer_service, supplier_service

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


async def _to_account_read(db: AsyncSession, account, owner_type: str, owner_name: str) -> dict:
    """
    current_balance/owner_type/owner_name aren't stored columns (see
    models/account.py) — assembled here rather than mutating the ORM
    object directly, since owner_type/owner_name aren't attributes
    Account actually has.
    """
    balance = await account_service.get_current_balance(db, account.account_id)
    return {
        "account_id": account.account_id,
        "buyer_id": account.buyer_id,
        "supplier_id": account.supplier_id,
        "agent_id": account.agent_id,
        "owner_type": owner_type,
        "opening_balance": account.opening_balance,
        "created_at": account.created_at,
        "current_balance": balance,
        "owner_name": owner_name,
    }


@router.get("/buyer/{buyer_id}", response_model=AccountRead)
async def get_buyer_account(
    buyer_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentLedger.jsx — ownership enforced via buyer_service.get_buyer (404 if not this agent's)."""
    buyer = await buyer_service.get_buyer(db, buyer_id, agent.agent_id)
    account = await account_service.get_account(db, buyer_id=buyer_id)
    return await _to_account_read(db, account, "buyer", buyer.name)


@router.get("/supplier/{supplier_id}", response_model=AccountRead)
async def get_supplier_account(
    supplier_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """AgentLedger.jsx — ownership enforced via supplier_service.get_supplier."""
    supplier = await supplier_service.get_supplier(db, supplier_id, agent.agent_id)
    account = await account_service.get_account(db, supplier_id=supplier_id)
    return await _to_account_read(db, account, "supplier", supplier.name)


@router.get("/me", response_model=AccountRead)
async def get_my_agent_account(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentDashboard.jsx — an agent's own commission-earnings account.
    Deliberately no /agent/{agent_id} path for viewing OTHER agents'
    accounts here — that would be an Admin concern (not yet wired, see
    the running list of admin-read gaps), so this only ever resolves
    to "your own" account via the authenticated session.
    """
    account = await account_service.get_account(db, agent_id=agent.agent_id)
    return await _to_account_read(db, account, "agent", "")


@router.get("/{account_id}/transactions", response_model=List[TransactionRead])
async def get_account_transactions(
    account_id: int,
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentLedger.jsx statement view — running_balance attached per row
    (see account_service.list_transactions_with_running_balance).

    Ownership check: the account must belong to one of this agent's own
    buyers/suppliers, or to the agent themselves — done by loading the
    account first and checking its owner ids, rather than requiring the
    caller to already know which kind of owner it is.
    """
    account = await account_service.get_account_by_id(db, account_id)

    if account.buyer_id is not None:
        await buyer_service.get_buyer(db, account.buyer_id, agent.agent_id)
    elif account.supplier_id is not None:
        await supplier_service.get_supplier(db, account.supplier_id, agent.agent_id)
    elif account.agent_id != agent.agent_id:
        raise HTTPException(status_code=403, detail="This account does not belong to you")

    return await account_service.list_transactions_with_running_balance(db, account_id)
