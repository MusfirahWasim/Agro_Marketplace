from sqlalchemy import Column, Integer, String, Text, Boolean, SmallInteger, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    icon_url = Column(String(500))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    sort_order = Column(SmallInteger, default=0)
    created_at = Column(DateTime, server_default=func.now())