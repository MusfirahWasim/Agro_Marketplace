# from sqlalchemy.ext.asyncio import AsyncSession
# from app.models.payment import WalletTransaction
# from app.models.user import User
# from decimal import Decimal

# async def update_wallet_balance(db: AsyncSession, user_id: int, amount: Decimal, txn_type: str, note: str, new_balance: Decimal):
#     txn = WalletTransaction(
#         user_id=user_id,
#         type=txn_type,
#         amount=amount,
#         balance_after=new_balance,
#         note=note
#     )
#     db.add(txn)
#     user = await db.get(User, user_id)
#     user.wallet_balance = new_balance
#     await db.commit()

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.payment import WalletTransaction
from app.models.user import User
from decimal import Decimal


async def update_wallet_balance(
    db: AsyncSession,
    user_id: int,
    amount: Decimal,
    txn_type: str,          # "credit" | "debit" | "topup"
    note: str,
    new_balance: Decimal,
    booking_id: int = None, # optional booking reference
):
    txn = WalletTransaction(
        user_id=user_id,
        booking_id=booking_id,
        type=txn_type,
        amount=amount,
        balance_after=new_balance,
        note=note,
    )
    db.add(txn)

    user = await db.get(User, user_id)
    user.wallet_balance = new_balance
    # Note: caller is responsible for db.commit()