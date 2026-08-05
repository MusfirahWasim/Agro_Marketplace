from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.order import Order
from app.models.consignment import Consignment
from app.models.supply import Supply
from app.models.payment import Payment
from app.models.party import Party
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.services.consignment_service import get_consignment, get_consignment_for_update
from app.services.commission_service import create_commission_for_order, commission_exists_for_order


async def verify_order_access(
    db: AsyncSession,
    order: Order,
    party: Party,
    allow_buyer: bool = True,
    allow_agent: bool = True,
) -> None:
    """
    Raises 403 unless `party` has a legitimate reason to view/act on
    this order. Reused by order.py's GET/PATCH {order_id} routes and
    payment.py's GET /order/{order_id} route — this is the single
    place that logic lives, rather than duplicated per endpoint.

    Admin is always allowed. Buyer is allowed only if they placed the
    order. Agent is allowed only if they own the consignment the order
    was placed against (one extra query, since agent_id isn't directly
    on Order).
    """
    if party.party_type == "A":
        return

    if allow_buyer and party.party_type == "B" and order.buyer_id == party.party_id:
        return

    if allow_agent and party.party_type == "CA":
        result = await db.execute(
            select(Consignment.agent_id).where(
                Consignment.consigned_id == order.consigned_id
            )
        )
        agent_id = result.scalar_one_or_none()
        if agent_id == party.party_id:
            return

    raise HTTPException(status_code=403, detail="You do not have access to this order")


async def create_order(db: AsyncSession, buyer: Party, data: OrderCreate) -> Order:
    """
    BuyerCheckout.jsx. This is the second of the two core workflow
    steps. rate_per_unit and total_amount are computed here from the
    consignment's selling_price_per_unit — NEVER accepted from the
    client, which would let a buyer submit a tampered price.
    """
    # locked fetch — holds the row until commit, so two buyers can't
    # both pass the availability check against the same consignment
    # at the same time (see gap #4)
    consignment = await get_consignment_for_update(db, data.consigned_id)

    if consignment.status != "confirmed":
        raise HTTPException(status_code=400, detail="This consignment is not available for ordering")
    if data.quantity_ordered > consignment.quantity_remaining:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")

    rate_per_unit = consignment.selling_price_per_unit
    total_amount = rate_per_unit * data.quantity_ordered

    order = Order(
        buyer_id=buyer.party_id,
        buyer_type=buyer.party_type,
        consigned_id=consignment.consigned_id,
        quantity_ordered=data.quantity_ordered,
        rate_per_unit=rate_per_unit,
        total_amount=total_amount,
        payment_term=data.payment_term,
        status="pending",
    )
    db.add(order)

    # update the consignment's running totals in the same transaction
    consignment.quantity_sold += data.quantity_ordered
    consignment.quantity_remaining -= data.quantity_ordered

    # fully sold out — no more stock left to sell against this consignment
    if consignment.quantity_remaining == 0:
        consignment.status = "completed"

    await db.commit()
    await db.refresh(order)
    return order


async def get_order(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(select(Order).where(Order.order_id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


async def list_orders_for_buyer(db: AsyncSession, buyer_id: int) -> List[Order]:
    """
    BuyerOrders.jsx. Joins through to Supply for product_name, and
    computes payment_status/amount_paid per row via get_payment_status.
    This is the one list endpoint where that N+1 cost is worth paying —
    payment status (Paid/Due/Refunded) is the entire reason this screen
    exists. list_orders_for_agent and list_all_orders deliberately still
    skip this.
    """
    result = await db.execute(
        select(Order, Supply.item_name)
        .join(Consignment, Order.consigned_id == Consignment.consigned_id)
        .join(Supply, Consignment.supply_id == Supply.supply_id)
        .where(Order.buyer_id == buyer_id)
        .order_by(Order.order_date.desc())
    )

    orders = []
    for order, item_name in result.all():
        order.product_name = item_name
        payment_info = await get_payment_status(db, order)
        order.payment_status = payment_info["payment_status"]
        order.amount_paid = payment_info["amount_paid"]
        orders.append(order)
    return orders


async def list_orders_for_agent(db: AsyncSession, agent_id: int) -> List[Order]:
    """AgentOrders.jsx — orders placed against any consignment this agent manages."""
    result = await db.execute(
        select(Order)
        .join(Consignment, Order.consigned_id == Consignment.consigned_id)
        .where(Consignment.agent_id == agent_id)
    )
    return result.scalars().all()


async def list_all_orders(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Order]:
    """Admin: AdminOrdersOverview.jsx — every order in the system, unfiltered."""
    result = await db.execute(select(Order).offset(skip).limit(limit))
    return result.scalars().all()


# Explicit state machine — completed/cancelled are terminal. NOTE: this
# now also blocks completed -> pending, which was previously allowed
# (that was the exact scenario that exposed the duplicate-commission
# bug earlier). Blocking it here is a stricter, more correct guarantee
# than the DB-existence-check fix alone — that fix still holds as a
# second line of defense, but this stops the toggle from being
# possible in the first place.
VALID_ORDER_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


async def update_status(db: AsyncSession, order_id: int, data: OrderStatusUpdate) -> Order:
    """
    Transitioning to 'completed' creates a commission — guarded by an
    actual DB check (commission_exists_for_order) as a second line of
    defense, in addition to the transition map above now making
    completed a true terminal state.

    Transitioning to 'cancelled' restores the ordered quantity back to
    the consignment (quantity_sold/quantity_remaining), reopening the
    consignment if it had auto-completed from selling out. Mirrors the
    same restore pattern already used in consignment_service.update_status.
    """
    order = await get_order(db, order_id)

    if data.status not in VALID_ORDER_TRANSITIONS.get(order.status, set()):
        if order.status == "completed" and data.status == "cancelled":
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel a completed order — process a refund instead",
            )
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change order status from '{order.status}' to '{data.status}'",
        )

    if data.status == "cancelled":
        consignment = await get_consignment(db, order.consigned_id)
        consignment.quantity_sold -= order.quantity_ordered
        consignment.quantity_remaining += order.quantity_ordered
        if consignment.status == "completed":
            consignment.status = "confirmed"

    order.status = data.status

    if data.status == "completed" and not await commission_exists_for_order(db, order.order_id):
        await create_commission_for_order(db, order)

    await db.commit()
    await db.refresh(order)
    return order


async def get_payment_status(db: AsyncSession, order: Order) -> dict:
    """
    Derives payment status from `payments` — per our earlier decision,
    this is intentionally NOT a stored column on `orders`.
    """
    result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount_paid), 0)).where(
            Payment.order_id == order.order_id
        )
    )
    amount_paid = result.scalar_one()

    if amount_paid <= 0:
        payment_status = "due"
    elif amount_paid >= order.total_amount:
        payment_status = "paid"
    else:
        payment_status = "partially_paid"

    # NOTE: "refunded" isn't distinguished here yet — needs a check for
    # a refund-type payment/account entry against this order once the
    # refund flow is actually built out.

    return {"payment_status": payment_status, "amount_paid": amount_paid}