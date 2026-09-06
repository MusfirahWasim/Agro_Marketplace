from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent, get_current_user
from app.models.commission_agent import CommissionAgent
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleStatusUpdate, SaleRead
from app.services import sale_service

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.post("", response_model=SaleRead, status_code=201)
async def create_sale(
    data: SaleCreate,
    agent: CommissionAgent = Depends(get_current_agent),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentCreateSale.jsx. Also posts a 'sale' debit to the buyer's
    account (see sale_service.py) — created_by is the authenticated
    user_id, distinct from agent.agent_id.
    """
    return await sale_service.create_sale(db, agent.agent_id, current_user.user_id, data)


@router.get("", response_model=List[SaleRead])
async def list_sales(
    agent: CommissionAgent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    buyer_id: Optional[int] = None,
):
    """
    AgentSales.jsx — sales this agent has created. AgentLedger.jsx
    passes ?buyer_id= for one buyer's history specifically.

    NOTE: passing buyer_id currently does not additionally verify that
    buyer belongs to this agent — sale_service.list_sales_for_buyer has
    no agent-ownership filter of its own. Low risk in practice (buyer
    IDs aren't guessable/enumerable data), but worth tightening if that
    matters.
    """
    if buyer_id is not None:
        return await sale_service.list_sales_for_buyer(db, buyer_id)
    return await sale_service.list_sales_for_agent(db, agent.agent_id)


@router.get("/{sale_id}", response_model=SaleRead)
async def get_sale(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    _agent: CommissionAgent = Depends(get_current_agent),
):
    return await sale_service.get_sale(db, sale_id)


@router.patch("/{sale_id}/status", response_model=SaleRead)
async def update_sale_status(
    sale_id: int,
    data: SaleStatusUpdate,
    agent: CommissionAgent = Depends(get_current_agent),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Transitioning to 'completed' triggers per-sale_item commission
    creation (see sale_service.update_status / commission_service.py) —
    created_by is required for that ledger posting.
    """
    return await sale_service.update_status(
        db, sale_id, agent.agent_id, current_user.user_id, data
    )
