from decimal import Decimal
from datetime import datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.payment import Payment
from app.models.account import Account
from app.models.sale import Sale
from app.models.transaction import Transaction
from app.schemas.payment import PaymentCreate
from app.services.account_service import get_account_by_id, record_transaction
from app.services.receipt_service import create_receipt_for_payment


async def _amount_already_paid_for_sale(db: AsyncSession, sale_id: int) -> Decimal:
    """
    Sums prior FIFO-allocation transactions for one sale — NOT prior
    'sale' debits or 'adjustment' reversals, only actual applied
    payments. This is how "how much of sale X is still owed" is
    derived, since payments has no sale_id column of its own (see the
    design decision below).
    """
    result = await db.execute(
        select(Transaction.credit_amount).where(
            Transaction.reference_type == "sale",
            Transaction.reference_id == sale_id,
            Transaction.transaction_type == "payment",
        )
    )
    return sum((row for row in result.scalars().all()), Decimal("0.00"))


async def _allocate_buyer_payment_fifo(
    db: AsyncSession, buyer_id: int, payment: Payment, created_by: int
) -> None:
    """
    Design decision (confirmed): a buyer payment auto-applies to their
    oldest unpaid/partial sales first, since `payments` has no sale_id
    of its own — it's a general account settlement, not tied to one
    invoice.

    Implementation note: rather than one transaction referencing the
    payment (reference_type='payment') PLUS separate rows tracking
    per-sale allocation, this posts the allocation transactions
    DIRECTLY against each sale (reference_type='sale', reference_id=
    sale_id, transaction_type='payment') — avoiding double-counting the
    buyer's balance while still making "amount paid toward sale X"
    queryable later. The trade-off: these specific rows don't carry a
    hard FK back to which Payment produced them — the Payment row
    itself (and this transaction's description) is what preserves that.
    Any leftover amount after every unpaid sale is fully covered is
    posted as a general advance credit (reference_type='payment',
    reference_id=payment.payment_id) instead.
    """
    remaining = payment.amount_paid

    sales_result = await db.execute(
        select(Sale)
        .where(
            Sale.buyer_id == buyer_id,
            Sale.payment_status != "paid",
            Sale.status != "cancelled",
        )
        .order_by(Sale.sale_date)
    )
    unpaid_sales = sales_result.scalars().all()

    for sale in unpaid_sales:
        if remaining <= 0:
            break

        already_paid = await _amount_already_paid_for_sale(db, sale.sale_id)
        owed = sale.total_amount - already_paid
        if owed <= 0:
            continue

        applied = min(remaining, owed)

        await record_transaction(
            db,
            account_id=payment.account_id,
            transaction_type="payment",
            description=f"Payment #{payment.payment_id} applied to Sale #{sale.sale_id}",
            created_by=created_by,
            credit_amount=applied,
            reference_type="sale",
            reference_id=sale.sale_id,
        )

        sale.payment_status = "paid" if applied == owed else "partial"
        remaining -= applied

    if remaining > 0:
        # Buyer paid more than every outstanding sale required — record
        # as a general advance credit against the account, not tied to
        # a specific sale.
        await record_transaction(
            db,
            account_id=payment.account_id,
            transaction_type="payment",
            description=f"Payment #{payment.payment_id} — advance credit",
            created_by=created_by,
            credit_amount=remaining,
            reference_type="payment",
            reference_id=payment.payment_id,
        )


async def create_payment(
    db: AsyncSession, agent_id: int, created_by: int, data: PaymentCreate
) -> Payment:
    """
    AgentPayments.jsx — covers both buyer-pays-agent and agent-pays-
    supplier, distinguished by which kind of account.account_id targets
    (see schemas/payment.py). Unlike v1's payer/payee pair, there is
    only ONE side posted here — v2's accounts table has no general
    "agent's own cash" account for the other leg, only a commission-
    earnings account (see account_service.py's sign-convention note),
    so a supplier payment only debits the supplier's payable balance;
    it doesn't also credit anything on the agent's side.

    Payments targeting an agent's OWN account are rejected — that
    account only receives system-posted commission credits (see
    commission_service.py), it isn't a manual payment target.
    """
    account = await get_account_by_id(db, data.account_id)
    if account.agent_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Payments cannot be recorded directly against an agent's own account",
        )

    payment = Payment(
        account_id=data.account_id,
        agent_id=agent_id,
        amount_paid=data.amount_paid,
        payment_method=data.payment_method,
        transaction_reference=data.transaction_reference,
        payment_date=data.payment_date or datetime.utcnow(),
        notes=data.notes,
        created_by=created_by,
    )
    db.add(payment)
    await db.flush()  # need payment.payment_id before posting ledger entries

    if account.buyer_id is not None:
        await _allocate_buyer_payment_fifo(db, account.buyer_id, payment, created_by)
    else:
        # Supplier payment — simple single debit, no FIFO (consignments
        # don't carry their own payment_status the way sales do).
        await record_transaction(
            db,
            account_id=account.account_id,
            transaction_type="payment",
            description=f"Payment #{payment.payment_id} to supplier",
            created_by=created_by,
            debit_amount=data.amount_paid,  # reduces what's owed to the supplier
            reference_type="payment",
            reference_id=payment.payment_id,
        )

    await create_receipt_for_payment(db, payment, created_by)

    await db.commit()
    await db.refresh(payment)
    return payment


async def get_payment(db: AsyncSession, payment_id: int) -> Payment:
    result = await db.execute(select(Payment).where(Payment.payment_id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


async def list_payments_for_account(db: AsyncSession, account_id: int) -> List[Payment]:
    """AgentLedger.jsx / AgentPayments.jsx history for one buyer or supplier."""
    result = await db.execute(select(Payment).where(Payment.account_id == account_id))
    return result.scalars().all()


async def list_payments_for_agent(db: AsyncSession, agent_id: int) -> List[Payment]:
    """AgentPayments.jsx — every payment this agent has personally recorded."""
    result = await db.execute(select(Payment).where(Payment.agent_id == agent_id))
    return result.scalars().all()


async def list_all_payments(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Payment]:
    """Admin — unfiltered, if AdminOutstandingBalances.jsx ever needs raw payment history."""
    result = await db.execute(select(Payment).offset(skip).limit(limit))
    return result.scalars().all()
