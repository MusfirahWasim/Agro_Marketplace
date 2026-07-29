from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.party import Party
from app.models.order import Order
from app.models.consignment import Consignment
from app.models.account import Account


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """
    AdminDashboard.jsx — system-wide totals across all four roles.
    Pulls directly from Party/Order/Consignment/Account since these are
    simple aggregate reads with no business rules attached — nothing
    here belongs in party_service/order_service etc., which are scoped
    to single-party operations, not cross-party admin aggregates.
    """
    party_counts_result = await db.execute(
        select(Party.party_type, func.count(Party.party_id)).group_by(Party.party_type)
    )
    parties_by_type = {row[0]: row[1] for row in party_counts_result.all()}

    total_orders_result = await db.execute(select(func.count(Order.order_id)))
    total_orders = total_orders_result.scalar_one()

    total_order_value_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
    )
    total_order_value = total_order_value_result.scalar_one()

    active_consignments_result = await db.execute(
        select(func.count(Consignment.consigned_id)).where(
            Consignment.status == "confirmed"
        )
    )
    active_consignments = active_consignments_result.scalar_one()

    total_ledger_credit_result = await db.execute(
        select(func.coalesce(func.sum(Account.credit_amount), 0))
    )
    total_ledger_credit = total_ledger_credit_result.scalar_one()

    return {
        "parties_by_type": parties_by_type,
        "total_orders": total_orders,
        "total_order_value": total_order_value,
        "active_consignments": active_consignments,
        "total_ledger_credit_volume": total_ledger_credit,
    }
