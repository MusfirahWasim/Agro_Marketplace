"""
app/routers/admin.py

Add to main.py:
    from app.routers import admin as admin_router
    app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])

This router adds a special `is_admin` check based on email.
No DB schema change needed — we just check email == "admin@admin.com".

Endpoints
─────────
GET  /admin/stats
GET  /admin/bookings?skip=0&limit=20
GET  /admin/users?skip=0&limit=20
GET  /admin/transactions?skip=0&limit=20
GET  /admin/disputes
POST /admin/disputes              { booking_id, reason }
GET  /admin/disputes/{id}/messages
POST /admin/disputes/{id}/messages  { content }
PATCH /admin/disputes/{id}/resolve  { resolution }
PATCH /admin/bookings/{id}/status?status=...
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


# ─── Admin guard ──────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.email != "admin@admin.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ─── Pydantic schemas ─────────────────────────────────────────────

class DisputeCreate(BaseModel):
    booking_id: int
    reason: str

class DisputeMessageCreate(BaseModel):
    content: str

class DisputeResolve(BaseModel):
    resolution: str


# ─── STATS ────────────────────────────────────────────────────────

@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    # Total users
    total_users = (await db.execute(text("SELECT COUNT(*) FROM users"))).scalar()

    # Active providers
    active_providers = (await db.execute(text("SELECT COUNT(*) FROM providers"))).scalar()

    # Bookings by status
    booking_rows = (await db.execute(text(
        "SELECT status, COUNT(*) as cnt FROM bookings GROUP BY status"
    ))).fetchall()
    bookings_by_status = {r[0]: r[1] for r in booking_rows}
    total_bookings = sum(bookings_by_status.values())

    # Total revenue (sum of debit transactions tied to bookings = platform received)
    total_revenue = (await db.execute(text(
        "SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type='debit'"
    ))).scalar()

    # Total wallet top-ups
    total_wallet_topups = (await db.execute(text(
        "SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type='topup'"
    ))).scalar()

    # Open disputes
    open_disputes = (await db.execute(text(
        "SELECT COUNT(*) FROM disputes WHERE status='open'"
    ))).scalar()

    # Recent 5 bookings
    recent_rows = (await db.execute(text("""
        SELECT b.id, b.status, b.scheduled_at, b.address,
               u.full_name  AS customer_name,
               pu.full_name AS provider_name,
               ps.title     AS service_title,
               ps.price     AS service_price
        FROM bookings b
        JOIN users u  ON b.user_id     = u.id
        JOIN providers p ON b.provider_id = p.id
        JOIN users pu ON p.user_id     = pu.id
        JOIN provider_services ps ON b.service_id = ps.id
        ORDER BY b.created_at DESC
        LIMIT 5
    """))).fetchall()

    recent_bookings = [
        {
            "id": r[0], "status": r[1],
            "scheduled_at": r[2].isoformat() if r[2] else None,
            "address": r[3],
            "customer_name": r[4], "provider_name": r[5],
            "service_title": r[6], "service_price": float(r[7] or 0),
        }
        for r in recent_rows
    ]

    return {
        "total_users": total_users,
        "active_providers": active_providers,
        "total_bookings": total_bookings,
        "bookings_by_status": bookings_by_status,
        "total_revenue": float(total_revenue),
        "total_wallet_topups": float(total_wallet_topups),
        "open_disputes": open_disputes,
        "recent_bookings": recent_bookings,
    }


# ─── BOOKINGS ─────────────────────────────────────────────────────

@router.get("/bookings")
async def get_all_bookings(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (await db.execute(text("""
        SELECT b.id, b.user_id, b.provider_id, b.service_id,
               b.status, b.description, b.scheduled_at, b.address, b.created_at,
               u.full_name  AS customer_name,
               pu.full_name AS provider_name,
               ps.title     AS service_title,
               ps.price     AS service_price
        FROM bookings b
        JOIN users u  ON b.user_id     = u.id
        JOIN providers p ON b.provider_id = p.id
        JOIN users pu ON p.user_id     = pu.id
        JOIN provider_services ps ON b.service_id = ps.id
        ORDER BY b.created_at DESC
        LIMIT :limit OFFSET :skip
    """), {"limit": limit, "skip": skip})).fetchall()

    return [
        {
            "id": r[0], "user_id": r[1], "provider_id": r[2], "service_id": r[3],
            "status": r[4], "description": r[5],
            "scheduled_at": r[6].isoformat() if r[6] else None,
            "address": r[7],
            "created_at": r[8].isoformat() if r[8] else None,
            "customer_name": r[9], "provider_name": r[10],
            "service_title": r[11], "service_price": float(r[12] or 0),
        }
        for r in rows
    ]


@router.patch("/bookings/{booking_id}/status")
async def admin_update_booking_status(
    booking_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    allowed = {"requested", "accepted", "completed", "cancelled", "rejected"}
    if status not in allowed:
        raise HTTPException(400, f"Invalid status. Allowed: {allowed}")

    result = await db.execute(
        text("UPDATE bookings SET status=:status WHERE id=:id"),
        {"status": status, "id": booking_id}
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Booking not found")
    return {"message": "Status updated", "booking_id": booking_id, "status": status}


# ─── USERS ────────────────────────────────────────────────────────

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (await db.execute(text("""
        SELECT id, full_name, email, phone, role, wallet_balance, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :skip
    """), {"limit": limit, "skip": skip})).fetchall()

    return [
        {
            "id": r[0], "full_name": r[1], "email": r[2], "phone": r[3],
            "role": r[4], "wallet_balance": float(r[5] or 0),
            "created_at": r[6].isoformat() if r[6] else None,
        }
        for r in rows
    ]


# ─── TRANSACTIONS ─────────────────────────────────────────────────

@router.get("/transactions")
async def get_all_transactions(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (await db.execute(text("""
        SELECT wt.id, wt.user_id, wt.booking_id, wt.type,
               wt.amount, wt.balance_after, wt.note, wt.created_at,
               u.full_name AS user_name
        FROM wallet_transactions wt
        JOIN users u ON wt.user_id = u.id
        ORDER BY wt.created_at DESC
        LIMIT :limit OFFSET :skip
    """), {"limit": limit, "skip": skip})).fetchall()

    return [
        {
            "id": r[0], "user_id": r[1], "booking_id": r[2], "type": r[3],
            "amount": float(r[4] or 0), "balance_after": float(r[5] or 0),
            "note": r[6],
            "created_at": r[7].isoformat() if r[7] else None,
            "user_name": r[8],
        }
        for r in rows
    ]


# ─── DISPUTES ─────────────────────────────────────────────────────
# We create two tiny tables on first startup via raw SQL if they don't exist.
# They are intentionally lightweight — no ORM model needed.

DISPUTES_INIT_SQL = """
CREATE TABLE IF NOT EXISTS disputes (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id  BIGINT UNSIGNED NOT NULL,
    reporter_id BIGINT UNSIGNED NOT NULL,
    reason      TEXT            NOT NULL,
    status      ENUM('open','resolved') NOT NULL DEFAULT 'open',
    resolution  TEXT            DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

DISPUTE_MESSAGES_INIT_SQL = """
CREATE TABLE IF NOT EXISTS dispute_messages (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    dispute_id  BIGINT UNSIGNED NOT NULL,
    sender_id   BIGINT UNSIGNED NOT NULL,
    sender_role ENUM('admin','user') NOT NULL DEFAULT 'user',
    content     TEXT            NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_dm_dispute (dispute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""


async def ensure_dispute_tables(db: AsyncSession):
    """Create tables if they don't exist (idempotent)."""
    await db.execute(text(DISPUTES_INIT_SQL))
    await db.execute(text(DISPUTE_MESSAGES_INIT_SQL))
    await db.commit()


@router.on_event("startup")
async def create_dispute_tables():
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        await ensure_dispute_tables(db)


@router.get("/disputes")
async def get_disputes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await ensure_dispute_tables(db)
    rows = (await db.execute(text("""
        SELECT d.id, d.booking_id, d.reporter_id, d.reason,
               d.status, d.resolution, d.created_at,
               u.full_name AS reporter_name
        FROM disputes d
        JOIN users u ON d.reporter_id = u.id
        ORDER BY d.created_at DESC
    """))).fetchall()

    return [
        {
            "id": r[0], "booking_id": r[1], "reporter_id": r[2],
            "reason": r[3], "status": r[4], "resolution": r[5],
            "created_at": r[6].isoformat() if r[6] else None,
            "reporter_name": r[7],
        }
        for r in rows
    ]


@router.post("/disputes", status_code=201)
async def create_dispute(
    data: DisputeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Any logged-in user can open a dispute against a booking."""
    await ensure_dispute_tables(db)

    # Verify the booking exists and belongs to the user (or is their provider booking)
    row = (await db.execute(
        text("SELECT id FROM bookings WHERE id=:bid AND (user_id=:uid OR provider_id IN (SELECT id FROM providers WHERE user_id=:uid))"),
        {"bid": data.booking_id, "uid": current_user.id}
    )).fetchone()

    if not row:
        raise HTTPException(404, "Booking not found or not accessible")

    await db.execute(text("""
        INSERT INTO disputes (booking_id, reporter_id, reason)
        VALUES (:booking_id, :reporter_id, :reason)
    """), {"booking_id": data.booking_id, "reporter_id": current_user.id, "reason": data.reason})
    await db.commit()

    return {"message": "Dispute filed successfully"}


@router.get("/disputes/{dispute_id}/messages")
async def get_dispute_messages(
    dispute_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_dispute_tables(db)
    rows = (await db.execute(text("""
        SELECT dm.id, dm.sender_id, dm.sender_role, dm.content, dm.created_at,
               u.full_name AS sender_name
        FROM dispute_messages dm
        JOIN users u ON dm.sender_id = u.id
        WHERE dm.dispute_id = :did
        ORDER BY dm.created_at ASC
    """), {"did": dispute_id})).fetchall()

    return [
        {
            "id": r[0], "sender_id": r[1], "sender_role": r[2],
            "content": r[3],
            "created_at": r[4].isoformat() if r[4] else None,
            "sender_name": r[5],
        }
        for r in rows
    ]


@router.post("/disputes/{dispute_id}/messages", status_code=201)
async def post_dispute_message(
    dispute_id: int,
    data: DisputeMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_dispute_tables(db)
    role = "admin" if current_user.email == "admin@admin.com" else "user"

    await db.execute(text("""
        INSERT INTO dispute_messages (dispute_id, sender_id, sender_role, content)
        VALUES (:did, :sid, :role, :content)
    """), {"did": dispute_id, "sid": current_user.id, "role": role, "content": data.content})
    await db.commit()
    return {"message": "Message sent"}


@router.patch("/disputes/{dispute_id}/resolve")
async def resolve_dispute(
    dispute_id: int,
    data: DisputeResolve,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await ensure_dispute_tables(db)
    result = await db.execute(text("""
        UPDATE disputes
        SET status='resolved', resolution=:res
        WHERE id=:did
    """), {"res": data.resolution, "did": dispute_id})
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Dispute not found")
    return {"message": "Dispute resolved"}