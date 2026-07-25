from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.order import Order
from app.models.consignment import Consignment
from app.models.payment import Payment
from app.models.party import Party
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.services.consignment_service import get_consignment
from app.services.commission_service import create_commission_for_order


async def create_order(db: AsyncSession, buyer: Party, data: OrderCreate) -> Order:
    """
    BuyerCheckout.jsx. This is the second of the two core workflow
    steps. rate_per_unit and total_amount are computed here from the
    consignment's selling_price_per_unit — NEVER accepted from the
    client, which would let a buyer submit a tampered price.
    """
    consignment = await get_consignment(db, data.consigned_id)

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
    """BuyerOrders.jsx"""
    result = await db.execute(select(Order).where(Order.buyer_id == buyer_id))
    return result.scalars().all()


async def list_orders_for_agent(db: AsyncSession, agent_id: int) -> List[Order]:
    """AgentOrders.jsx — orders placed against any consignment this agent manages."""
    result = await db.execute(
        select(Order)
        .join(Consignment, Order.consigned_id == Consignment.consigned_id)
        .where(Consignment.agent_id == agent_id)
    )
    return result.scalars().all()


async def update_status(db: AsyncSession, order_id: int, data: OrderStatusUpdate) -> Order:
    """
    Transitioning an order to 'completed' is what triggers commission
    creation — this is the one status change with a side effect, all
    others (confirmed/cancelled) just update the field.
    """
    order = await get_order(db, order_id)
    was_completed_before = order.status == "completed"

    order.status = data.status

    if data.status == "completed" and not was_completed_before:
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