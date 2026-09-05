from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.user import User
from app.models.commission_agent import CommissionAgent
from app.models.buyer import Buyer
from app.models.supplier import Supplier
from app.models.sale import Sale
from app.models.consignment import Consignment
from app.models.commission import Commission


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """
    AdminDashboard.jsx — system-wide monitoring totals. Admin never
    touches individual transactions, so everything here is a read-only
    aggregate, same principle as v1's admin_service.py.
    """
    total_agents_result = await db.execute(
        select(func.count(User.user_id)).where(User.role == "COMMISSION_AGENT")
    )
    total_agents = total_agents_result.scalar_one()

    active_agents_result = await db.execute(
        select(func.count(User.user_id)).where(
            User.role == "COMMISSION_AGENT", User.active_status == True  # noqa: E712
        )
    )
    active_agents = active_agents_result.scalar_one()

    # Doubles as the dashboard notification badge (option 1 from our
    # earlier decision — no persisted notifications table, just a
    # live count computed on read).
    pending_agents_result = await db.execute(
        select(func.count(User.user_id)).where(
            User.role == "COMMISSION_AGENT", User.active_status == False  # noqa: E712
        )
    )
    pending_agents = pending_agents_result.scalar_one()

    total_buyers_result = await db.execute(select(func.count(Buyer.buyer_id)))
    total_buyers = total_buyers_result.scalar_one()

    total_suppliers_result = await db.execute(select(func.count(Supplier.supplier_id)))
    total_suppliers = total_suppliers_result.scalar_one()

    total_sales_result = await db.execute(select(func.count(Sale.sale_id)))
    total_sales = total_sales_result.scalar_one()

    total_sales_value_result = await db.execute(
        select(func.coalesce(func.sum(Sale.total_amount), 0))
    )
    total_sales_value = total_sales_value_result.scalar_one()

    active_consignments_result = await db.execute(
        select(func.count(Consignment.consignment_id)).where(
            Consignment.status == "confirmed"
        )
    )
    active_consignments = active_consignments_result.scalar_one()

    total_commission_result = await db.execute(
        select(func.coalesce(func.sum(Commission.commission_amount), 0))
    )
    total_commission_volume = total_commission_result.scalar_one()

    return {
        "agents": {"total": total_agents, "active": active_agents, "pending": pending_agents},
        "total_buyers": total_buyers,
        "total_suppliers": total_suppliers,
        "total_sales": total_sales,
        "total_sales_value": total_sales_value,
        "active_consignments": active_consignments,
        "total_commission_volume": total_commission_volume,
    }


async def list_pending_agents(db: AsyncSession) -> list[User]:
    """AdminAgents.jsx — agents awaiting approval."""
    result = await db.execute(
        select(User).where(
            User.role == "COMMISSION_AGENT", User.active_status == False  # noqa: E712
        )
    )
    return result.scalars().all()


async def list_agents(db: AsyncSession) -> list[User]:
    """AdminAgents.jsx — full agent list (active + inactive)."""
    result = await db.execute(select(User).where(User.role == "COMMISSION_AGENT"))
    return result.scalars().all()


async def approve_agent(db: AsyncSession, user_id: int) -> User:
    """
    Flips active_status True. The agent's CommissionAgent profile and
    ledger Account already exist from signup (see auth_service.py) —
    approval is purely the login gate, nothing else to create here.
    """
    result = await db.execute(
        select(User).where(User.user_id == user_id, User.role == "COMMISSION_AGENT")
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Agent not found")

    user.active_status = True
    await db.commit()
    await db.refresh(user)
    return user


async def reject_agent(db: AsyncSession, user_id: int) -> None:
    """
    Design decision: since active_status can't distinguish "pending"
    from "rejected" (no separate field, per project decision), a
    rejected signup is deleted outright rather than left inactive
    forever indistinguishable from a fresh pending signup. Cascades to
    the linked CommissionAgent row (see User.commission_agent's
    cascade="all, delete-orphan"). Worth confirming this is the
    intended behavior for "reject" versus, say, keeping a record.
    """
    result = await db.execute(
        select(User).where(User.user_id == user_id, User.role == "COMMISSION_AGENT")
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Agent not found")
    if user.active_status:
        raise HTTPException(status_code=400, detail="Cannot reject an already-approved agent")

    await db.delete(user)
    await db.commit()


async def set_agent_active_status(db: AsyncSession, user_id: int, active: bool) -> User:
    """Suspend/reinstate an already-approved agent (distinct from reject_agent)."""
    result = await db.execute(
        select(User).where(User.user_id == user_id, User.role == "COMMISSION_AGENT")
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Agent not found")

    user.active_status = active
    await db.commit()
    await db.refresh(user)
    return user
