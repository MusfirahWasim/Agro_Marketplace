from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.models.user import User

async def send_notification(db: AsyncSession, user_id: int, type: str, title: str, body: str, ref_id: str = None, ref_type: str = None):
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        ref_id=ref_id,
        ref_type=ref_type
    )
    db.add(notif)
    await db.commit()
    # Send push via FCM if token exists
    # user = await db.get(User, user_id)
    # if user.fcm_token: ...