from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.category import Category

class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_categories(self):
        stmt = select(Category).where(Category.is_active == True).order_by(Category.sort_order)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_category_by_slug(self, slug: str):
        stmt = select(Category).where(Category.slug == slug, Category.is_active == True)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()