from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.buyer import Buyer
from app.models.account import Account
from app.schemas.buyer import BuyerCreate, BuyerUpdate


async def create_buyer(db: AsyncSession, agent_id: int, data: BuyerCreate) -> Buyer:
    """
    Buyers are registered BY the agent, not self-registered (they never
    log in) — this didn't exist in v1's party_service.py at all, since
    v1 handled buyer registration through auth_service.signup instead.

    Design decision, consistent with auth_service.signup's agent
    account: this also creates the buyer's own ledger Account
    (opening_balance = data.credit_limit's starting point... actually
    opening_balance is independent of credit_limit — see note below)
    in the same flow. Resolves the open question from schemas/account.py
    the same way it was resolved for agents.
    """
    buyer = Buyer(agent_id=agent_id, **data.model_dump())
    db.add(buyer)
    await db.flush()  # need buyer.buyer_id before creating the account

    # opening_balance defaults to 0 here — BuyerCreate has no
    # opening_balance field of its own (only credit_limit, which is a
    # spending ceiling, not a starting ledger balance). If a buyer can
    # be onboarded with an existing balance owed, this needs a field
    # added to BuyerCreate; flagging rather than assuming.
    account = Account(buyer_id=buyer.buyer_id, opening_balance=0)
    db.add(account)

    await db.commit()
    await db.refresh(buyer)
    return buyer


async def get_buyer(db: AsyncSession, buyer_id: int, agent_id: Optional[int] = None) -> Buyer:
    """
    agent_id=None means an unscoped lookup (Admin's read-only views);
    otherwise the buyer must belong to that agent — an agent can't
    reach into another agent's buyers by guessing an ID.
    """
    query = select(Buyer).where(Buyer.buyer_id == buyer_id)
    if agent_id is not None:
        query = query.where(Buyer.agent_id == agent_id)
    result = await db.execute(query)
    buyer = result.scalar_one_or_none()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    return buyer


async def list_buyers(
    db: AsyncSession, agent_id: Optional[int] = None, skip: int = 0, limit: int = 100
) -> List[Buyer]:
    """AgentBuyers.jsx passes its own agent_id; AdminBuyersSuppliers.jsx omits it for the full list."""
    query = select(Buyer)
    if agent_id is not None:
        query = query.where(Buyer.agent_id == agent_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def update_buyer(
    db: AsyncSession, buyer_id: int, agent_id: int, data: BuyerUpdate
) -> Buyer:
    buyer = await get_buyer(db, buyer_id, agent_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(buyer, field, value)
    await db.commit()
    await db.refresh(buyer)
    return buyer
