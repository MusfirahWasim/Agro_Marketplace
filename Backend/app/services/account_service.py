from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.account import Account
from app.models.transaction import Transaction


async def get_account(
    db: AsyncSession,
    buyer_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    agent_id: Optional[int] = None,
) -> Account:
    """Exactly one of buyer_id/supplier_id/agent_id should be provided."""
    query = select(Account)
    if buyer_id is not None:
        query = query.where(Account.buyer_id == buyer_id)
    elif supplier_id is not None:
        query = query.where(Account.supplier_id == supplier_id)
    elif agent_id is not None:
        query = query.where(Account.agent_id == agent_id)
    else:
        raise HTTPException(status_code=400, detail="An owner id is required")

    result = await db.execute(query)
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


async def get_current_balance(db: AsyncSession, account_id: int) -> Decimal:
    """
    current_balance is NOT stored (see models/account.py) — computed
    here as opening_balance + net(debit - credit) via a single
    aggregate query.

    Sign convention (finalized — buyer/supplier/agent are NOT
    symmetric, this is standard double-entry logic):
    - Buyer accounts are receivable-style: debit increases what the
      buyer owes (a 'sale'), credit decreases it (a payment). Balance
      here is positive == amount owed BY the buyer.
    - Supplier and agent accounts are payable-style (the business owes
      THEM): credit increases what's owed to them (a 'purchase' for
      suppliers, a 'commission' for agents), debit decreases it (a
      payout/payment made to them). Balance here comes out NEGATIVE —
      magnitude is the amount owed TO that supplier/agent. Callers
      displaying a supplier/agent balance should show abs(balance)
      labeled "owed to X", not the raw signed number.
    """
    account_result = await db.execute(
        select(Account.opening_balance).where(Account.account_id == account_id)
    )
    opening_balance = account_result.scalar_one_or_none()
    if opening_balance is None:
        raise HTTPException(status_code=404, detail="Account not found")

    sums_result = await db.execute(
        select(
            func.coalesce(func.sum(Transaction.debit_amount), 0),
            func.coalesce(func.sum(Transaction.credit_amount), 0),
        ).where(Transaction.account_id == account_id)
    )
    total_debit, total_credit = sums_result.one()

    return opening_balance + total_debit - total_credit


async def record_transaction(
    db: AsyncSession,
    account_id: int,
    transaction_type: str,
    description: str,
    created_by: int,
    debit_amount: Decimal = Decimal("0"),
    credit_amount: Decimal = Decimal("0"),
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> Transaction:
    """
    THE ONLY function in the codebase that should insert into
    `transactions` — same rule as v1's record_ledger_entry, just against
    the renamed table. Unlike v1, this does NOT compute/store a
    running_balance on the row (the schema doesn't have that column) —
    balance is purely a read-time computation (see get_current_balance
    / list_transactions_with_running_balance).

    Does not commit — the caller owns the transaction boundary, since a
    single business event (e.g. a payment split across several sales
    via FIFO) may need several of these to succeed or fail together.
    """
    entry = Transaction(
        account_id=account_id,
        transaction_type=transaction_type,
        description=description,
        debit_amount=debit_amount,
        credit_amount=credit_amount,
        reference_type=reference_type,
        reference_id=reference_id,
        created_by=created_by,
    )
    db.add(entry)
    await db.flush()  # so entry.transaction_id is available if the caller needs it
    return entry


async def list_transactions_for_account(db: AsyncSession, account_id: int) -> List[Transaction]:
    """Raw ledger rows, oldest first — powers list_transactions_with_running_balance below."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.account_id == account_id)
        .order_by(Transaction.transaction_date, Transaction.transaction_id)
    )
    return result.scalars().all()


async def list_transactions_with_running_balance(db: AsyncSession, account_id: int) -> List[Transaction]:
    """
    AgentLedger.jsx statement view — attaches a running_balance to each
    row in Python, walking forward from opening_balance, since the
    column itself isn't stored. Sets it as a plain attribute the same
    way v1 set denormalized display fields on ORM objects.
    """
    account = await get_account_by_id(db, account_id)
    transactions = await list_transactions_for_account(db, account_id)

    balance = account.opening_balance
    for tx in transactions:
        balance = balance + tx.debit_amount - tx.credit_amount
        tx.running_balance = balance
    return transactions


async def get_account_by_id(db: AsyncSession, account_id: int) -> Account:
    result = await db.execute(select(Account).where(Account.account_id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


async def list_all_accounts_with_balances(db: AsyncSession) -> List[dict]:
    """
    AdminOutstandingBalances.jsx — every account with its computed
    balance. Loops and computes per-account rather than one aggregate
    query, since current_balance isn't a queryable column; fine at
    expected data volumes, worth revisiting if this list grows large.
    """
    result = await db.execute(select(Account))
    accounts = result.scalars().all()

    output = []
    for account in accounts:
        balance = await get_current_balance(db, account.account_id)
        output.append({"account": account, "current_balance": balance})
    return output
