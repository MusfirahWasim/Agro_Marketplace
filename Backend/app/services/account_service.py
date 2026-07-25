from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.account import Account


async def get_latest_balance(db: AsyncSession, party_id: int, party_type: str) -> Decimal:
    result = await db.execute(
        select(Account.running_balance)
        .where(Account.party_id == party_id, Account.party_type == party_type)
        .order_by(Account.created_at.desc(), Account.account_id.desc())
        .limit(1)
    )
    balance = result.scalar_one_or_none()
    return balance if balance is not None else Decimal("0")


async def record_ledger_entry(
    db: AsyncSession,
    party_id: int,
    party_type: str,
    transaction_type: str,
    description: Optional[str] = None,
    debit_amount: Decimal = Decimal("0"),
    credit_amount: Decimal = Decimal("0"),
    payment_id: Optional[int] = None,
    order_id: Optional[int] = None,
) -> Account:
    """
    THE ONLY function in the codebase that should insert into
    `accounts`. Called by payment_service.py (on every payment) and
    commission_service.py (on commission payout) so the running-balance
    calculation lives in exactly one place and can't drift.

    Does not commit — the caller owns the transaction boundary, since
    a payment typically writes two of these (payer + payee) that need
    to succeed or fail together.

    NOTE — debit/credit direction convention not yet confirmed with the
    team: this assumes debit_amount = increases what the party owes,
    credit_amount = decreases what the party owes (standard
    accounts-receivable-style ledger). Confirm this matches intent
    before relying on running_balance sign in the UI.
    """
    previous_balance = await get_latest_balance(db, party_id, party_type)
    new_balance = previous_balance + debit_amount - credit_amount

    entry = Account(
        party_id=party_id,
        party_type=party_type,
        transaction_type=transaction_type,
        description=description,
        debit_amount=debit_amount,
        credit_amount=credit_amount,
        running_balance=new_balance,
        payment_id=payment_id,
        order_id=order_id,
    )
    db.add(entry)
    await db.flush()  # so entry.account_id is available if the caller needs it
    return entry


async def list_ledger_for_party(db: AsyncSession, party_id: int, party_type: str) -> List[Account]:
    """
    Powers SupplierPayments.jsx, AgentSettlements.jsx, BuyerPayments.jsx
    — each just filters this same ledger to their own party.
    """
    result = await db.execute(
        select(Account)
        .where(Account.party_id == party_id, Account.party_type == party_type)
        .order_by(Account.created_at)
    )
    return result.scalars().all()


async def list_all_ledger_entries(db: AsyncSession) -> List[Account]:
    """AdminAccountsLedger.jsx — the full, unfiltered ledger."""
    result = await db.execute(select(Account).order_by(Account.created_at))
    return result.scalars().all()
