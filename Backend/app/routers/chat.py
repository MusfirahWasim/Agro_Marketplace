"""
chat.py  — FastAPI router for real-time messaging
──────────────────────────────────────────────────
REST endpoints
  GET  /api/chat/rooms              → list my chat rooms
  GET  /api/chat/rooms/{room_id}/messages → history (50 latest)
  POST /api/chat/rooms/booking/{booking_id} → get-or-create a room for a booking

WebSocket
  WS   /api/chat/ws/{room_id}?token=<jwt>
       Accepts JSON frames:
         { "type": "text",  "content": "hello"             }
         { "type": "image", "content": "<base64-data-url>" }
         { "type": "file",  "content": "<base64-data-url>", "filename": "doc.pdf" }
         { "type": "voice", "content": "<base64-data-url>", "duration": 3.2 }
       Broadcasts to every connected participant in the room.
"""

from __future__ import annotations

import json
import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import decode_token   # returns the **payload dict** or None
from app.models import Booking, Chat, ChatMessage, User

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── CONNECTION MANAGER ──────────────────────────────────────────────────────

class ConnectionManager:
    """Keeps track of active WebSocket connections, keyed by room_id."""

    def __init__(self):
        # room_id → list[(user_id, websocket)]
        self._rooms: Dict[int, List[tuple[int, WebSocket]]] = {}

    async def connect(self, room_id: int, user_id: int, ws: WebSocket):
        await ws.accept()
        self._rooms.setdefault(room_id, []).append((user_id, ws))
        logger.info("WS connected  room=%s user=%s", room_id, user_id)

    def disconnect(self, room_id: int, user_id: int, ws: WebSocket):
        conns = self._rooms.get(room_id, [])
        self._rooms[room_id] = [(uid, w) for uid, w in conns if w is not ws]
        logger.info("WS disconnected room=%s user=%s", room_id, user_id)

    async def broadcast(self, room_id: int, payload: dict):
        dead = []
        for uid, ws in self._rooms.get(room_id, []):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append((uid, ws))
        for item in dead:
            self._rooms[room_id].remove(item)

    def online_users(self, room_id: int) -> List[int]:
        return [uid for uid, _ in self._rooms.get(room_id, [])]


manager = ConnectionManager()


# ─── HELPERS ─────────────────────────────────────────────────────────────────

async def _get_room_or_404(room_id: int, db: AsyncSession) -> Chat:
    result = await db.execute(select(Chat).where(Chat.id == room_id))
    room = result.scalars().first()
    if not room:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat room not found")
    return room


async def _assert_participant(room: Chat, user_id: int):
    if room.user_id != user_id and room.provider_user_id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a participant of this chat")


# ─── REST ROUTES ─────────────────────────────────────────────────────────────

@router.post("/rooms/booking/{booking_id}")
async def get_or_create_room(
    booking_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return an existing chat room for a booking, or create one."""
    # Load booking
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(404, "Booking not found")

    # Resolve provider's user_id
    from app.models import Provider  # local import to avoid circular
    res2 = await db.execute(select(Provider).where(Provider.id == booking.provider_id))
    provider = res2.scalars().first()
    if not provider:
        raise HTTPException(404, "Provider not found")

    # Auth check — must be customer or provider on this booking
    if current_user.id != booking.user_id and current_user.id != provider.user_id:
        raise HTTPException(403, "Not authorised")

    # Existing room?
    res3 = await db.execute(select(Chat).where(Chat.booking_id == booking_id))
    room = res3.scalars().first()
    if room:
        return {"id": room.id, "booking_id": room.booking_id}

    # Create
    room = Chat(
        booking_id=booking_id,
        user_id=booking.user_id,
        provider_user_id=provider.user_id,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return {"id": room.id, "booking_id": room.booking_id}


@router.get("/rooms")
async def get_chat_rooms(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all chat rooms for the current user, with last-message preview."""
    uid = current_user.id
    result = await db.execute(
        select(Chat).where(
            or_(Chat.user_id == uid, Chat.provider_user_id == uid)
        ).order_by(Chat.id.desc())
    )
    rooms = result.scalars().all()

    output = []
    for room in rooms:
        # last message
        last_msg_res = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.chat_id == room.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_res.scalars().first()

        # unread count
        unread_res = await db.execute(
            select(ChatMessage).where(
                ChatMessage.chat_id == room.id,
                ChatMessage.sender_id != uid,
                ChatMessage.is_read == False,
            )
        )
        unread = len(unread_res.scalars().all())

        # other participant's name
        other_uid = room.provider_user_id if room.user_id == uid else room.user_id
        other_res = await db.execute(select(User).where(User.id == other_uid))
        other = other_res.scalars().first()

        output.append({
            "id": room.id,
            "booking_id": room.booking_id,
            "other_user": {
                "id": other.id,
                "name": other.full_name,
                "role": other.role,
            } if other else None,
            "last_message": {
                "type": last_msg.message_type,
                "content": last_msg.content if last_msg.message_type == "text" else f"[{last_msg.message_type}]",
                "created_at": last_msg.created_at.isoformat(),
                "sender_id": last_msg.sender_id,
            } if last_msg else None,
            "unread_count": unread,
            "online": other_uid in manager.online_users(room.id),
        })

    return output


@router.get("/rooms/{room_id}/messages")
async def get_messages(
    room_id: int,
    limit: int = 50,
    before_id: Optional[int] = None,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return message history for a room (newest-first pagination)."""
    room = await _get_room_or_404(room_id, db)
    await _assert_participant(room, current_user.id)

    q = select(ChatMessage).where(ChatMessage.chat_id == room_id)
    if before_id:
        q = q.where(ChatMessage.id < before_id)
    q = q.order_by(ChatMessage.created_at.desc()).limit(limit)
    result = await db.execute(q)
    msgs = result.scalars().all()

    # Mark as read
    for m in msgs:
        if m.sender_id != current_user.id and not m.is_read:
            m.is_read = True
    await db.commit()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "message_type": m.message_type,
            "content": m.content,
            "attachment_url": m.attachment_url,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(msgs)  # return chronological order
    ]


# ─── WEBSOCKET ───────────────────────────────────────────────────────────────

@router.websocket("/ws/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: int,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Real-time chat over WebSocket.
    Auth via ?token=<jwt> query param (Bearer header not available in browsers).

    Incoming JSON frame schema:
      { "type": "text" | "image" | "file" | "voice",
        "content": "<text or base64-data-url>",
        "filename": "optional-for-file",
        "duration": <seconds-for-voice> }

    Outgoing broadcast frame:
      { "id": <msg_id>, "sender_id": <int>, "sender_name": <str>,
        "message_type": <str>, "content": <str>,
        "attachment_url": <str|null>, "created_at": <iso>,
        "is_read": false }
    """
    # ── Authenticate ─────────────────────────────────────────────────
    payload = decode_token(token)          # ← returns dict or None
    if not payload:
        await websocket.close(code=4001)
        return

    # Extract the user id from the "sub" field (JWT standard)
    user_id_str = payload.get("sub")
    if user_id_str is None:
        await websocket.close(code=4001)
        return
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        await websocket.close(code=4001)
        return

    # Fetch the user
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        await websocket.close(code=4001)
        return

    # ── Authorise ────────────────────────────────────────────────────
    try:
        room = await _get_room_or_404(room_id, db)
        await _assert_participant(room, user_id)
    except HTTPException:
        await websocket.close(code=4003)
        return

    # ── Connect ──────────────────────────────────────────────────────
    await manager.connect(room_id, user_id, websocket)

    # Notify others this user is online
    await manager.broadcast(room_id, {
        "type": "presence",
        "user_id": user_id,
        "status": "online",
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                frame = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = frame.get("type", "text")
            content   = frame.get("content", "")
            filename  = frame.get("filename")

            if not content:
                continue

            # Persist
            is_text = msg_type == "text"
            msg = ChatMessage(
                chat_id=room_id,
                sender_id=user_id,
                message_type=msg_type,
                content=content if is_text else None,
                attachment_url=content if not is_text else None,
                is_read=False,
            )
            db.add(msg)
            await db.commit()
            await db.refresh(msg)

            # Broadcast
            await manager.broadcast(room_id, {
                "id": msg.id,
                "sender_id": msg.sender_id,
                "sender_name": user.full_name,
                "message_type": msg.message_type,
                "content": msg.content,
                "attachment_url": msg.attachment_url,
                "filename": filename,
                "created_at": msg.created_at.isoformat(),
                "is_read": False,
            })

    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id, websocket)
        await manager.broadcast(room_id, {
            "type": "presence",
            "user_id": user_id,
            "status": "offline",
        })