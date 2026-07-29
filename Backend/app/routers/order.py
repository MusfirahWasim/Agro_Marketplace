from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_party, require_buyer, require_agent, require_admin
from app.models.party import Party
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderRead
from app.services import order_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])


# NOTE: /me and /agent/me must come BEFORE /{order_id} — same route-
# ordering reasoning as supply.py / consignment.py.

@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    buyer: Party = Depends(require_buyer),
    db: AsyncSession = Depends(get_db),
):
    """
    BuyerCheckout.jsx. rate_per_unit/total_amount are computed
    server-side from the consignment — never accepted from the client.
    """
    return await order_service.create_order(db, buyer, data)


@router.get("/me", response_model=List[OrderRead])
async def list_my_orders(
    buyer: Party = Depends(require_buyer),
    db: AsyncSession = Depends(get_db),
):
    """BuyerOrders.jsx"""
    return await order_service.list_orders_for_buyer(db, buyer.party_id)


@router.get("/agent/me", response_model=List[OrderRead])
async def list_orders_against_my_consignments(
    agent: Party = Depends(require_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    AgentOrders.jsx. NOTE: payment_status/amount_paid are NOT populated
    here — computing them per row would mean one extra query per order
    in this list (N+1). Only the single-order GET below computes it.
    Revisit with a batched query if this list needs it too.
    """
    return await order_service.list_orders_for_agent(db, agent.party_id)


@router.get("/", response_model=List[OrderRead], dependencies=[Depends(require_admin)])
async def list_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """AdminOrdersOverview.jsx — every order, unfiltered. Same N+1 note as above."""
    return await order_service.list_all_orders(db, skip, limit)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: int,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    Single-order detail — the only place payment_status/amount_paid
    are actually computed and returned, since it's just one extra
    query here rather than N.
    """
    order = await order_service.get_order(db, order_id)
    await order_service.verify_order_access(db, order, current_party)

    payment_info = await order_service.get_payment_status(db, order)

    result = OrderRead.model_validate(order)
    result.payment_status = payment_info["payment_status"]
    result.amount_paid = payment_info["amount_paid"]
    return result


@router.patch("/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    Only the agent who owns this order's consignment, or an admin, can
    update fulfillment status — buyers cannot (allow_buyer=False).
    Marking 'completed' triggers commission creation inside
    order_service — see commission_service.create_commission_for_order.
    """
    order = await order_service.get_order(db, order_id)
    await order_service.verify_order_access(db, order, current_party, allow_buyer=False)
    return await order_service.update_status(db, order_id, data)