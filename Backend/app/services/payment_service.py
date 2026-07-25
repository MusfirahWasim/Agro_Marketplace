from datetime import date
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.payment import Payment
from app.models.party import Party
from app.models.order import Order
from app.schemas.payment import PaymentCreate
from app.services.account_service import record_ledger_entry


async def create_payment(db: AsyncSession, payer: Party, data: PaymentCreate) -> Payment:
    """
    Covers all three flows (buyer->agent, agent->supplier, refunds) —
    the direction is just whoever is authenticated (payer) vs. the
    payee named in the request. payer is NEVER taken from the request
    body, only from the authenticated party.
    """
    result = await db.execute(
        select(Party).where(
            Party.party_id == data.payee_id, Party.party_type == data.payee_type
        )
    )
    payee = result.scalar_one_or_none()
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")

    if data.order_id:
        result = await db.execute(select(Order).where(Order.order_id == data.order_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Order not found")

    payment = Payment(
        payer_id=payer.party_id,
        payer_type=payer.party_type,
        payee_id=data.payee_id,
        payee_type=data.payee_type,
        payment_method=data.payment_method,
        order_id=data.order_id,
        amount_paid=data.amount_paid,
        transaction_reference=data.transaction_reference,
        payment_date=data.payment_date or date.today(),
    )
    db.add(payment)
    await db.flush()  # need payment.payment_id before writing ledger entries

    # One ledger row per affected party — payer's balance owed goes
    # down (credit), payee's balance receivable goes down (debit).
    # Same open convention question noted in account_service.py.
    await record_ledger_entry(
        db,
        party_id=payer.party_id,
        party_type=payer.party_type,
        transaction_type="payment",
        credit_amount=data.amount_paid,
        payment_id=payment.payment_id,
        order_id=data.order_id,
        description=f"Payment to {payee.name}",
    )
    await record_ledger_entry(
        db,
        party_id=payee.party_id,
        party_type=payee.party_type,
        transaction_type="payment",
        debit_amount=data.amount_paid,
        payment_id=payment.payment_id,
        order_id=data.order_id,
        description=f"Payment received from {payer.name}",
    )

    await db.commit()
    await db.refresh(payment)
    return payment


async def list_payments_for_party(db: AsyncSession, party_id: int, party_type: str) -> List[Payment]:
    """Either side of a payment — used by SupplierPayments.jsx, AgentSettlements.jsx, BuyerPayments.jsx."""
    result = await db.execute(
        select(Payment).where(
            ((Payment.payer_id == party_id) & (Payment.payer_type == party_type))
            | ((Payment.payee_id == party_id) & (Payment.payee_type == party_type))
        )
    )
    return result.scalars().all()


async def list_payments_for_order(db: AsyncSession, order_id: int) -> List[Payment]:
    """Used by order_service.get_payment_status and any order detail view."""
    result = await db.execute(select(Payment).where(Payment.order_id == order_id))
    return result.scalars().all()
