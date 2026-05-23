from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException
from app.models.chat import Chat, ChatMessage
from app.models.booking import Booking
from datetime import datetime

class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_chats(self, user_id: int):
        stmt = select(Chat).where(
            (Chat.user_id == user_id) | (Chat.provider_user_id == user_id)
        ).where(Chat.is_active == True)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_messages(self, room_id: int, user_id: int, limit: int = 50):
        # Verify user has access to this chat
        stmt = select(Chat).where(Chat.id == room_id)
        result = await self.db.execute(stmt)
        chat = result.scalar_one_or_none()
        
        if not chat:
            raise HTTPException(404, "Chat not found")
        if chat.user_id != user_id and chat.provider_user_id != user_id:
            raise HTTPException(403, "Access denied")
        
        stmt = select(ChatMessage).where(
            ChatMessage.chat_id == room_id,
            ChatMessage.is_deleted == False
        ).order_by(ChatMessage.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def send_message(self, room_id: int, sender_id: int, content: str, message_type: str = "text"):
        chat = await self.db.get(Chat, room_id)
        if not chat or not chat.is_active:
            raise HTTPException(404, "Chat not found or inactive")
        
        message = ChatMessage(
            chat_id=room_id,
            sender_id=sender_id,
            message_type=message_type,
            content=content
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def mark_as_read(self, message_id: int, user_id: int):
        message = await self.db.get(ChatMessage, message_id)
        if message and message.sender_id != user_id:
            message.is_read = True
            message.read_at = datetime.utcnow()
            await self.db.commit()