from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    """
    products has no agent_id — this is a shared catalog every agent
    draws from and adds to (confirmed decision), unlike buyers/
    suppliers which are agent-owned. name is globally unique
    (uq_product_name), so a duplicate name from a different agent is
    rejected the same way a duplicate email is in auth_service.signup.
    """
    product = Product(**data.model_dump())
    db.add(product)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="A product with this name already exists")
    await db.refresh(product)
    return product


async def get_product(db: AsyncSession, product_id: int) -> Product:
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def list_products(
    db: AsyncSession,
    category: Optional[str] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
) -> List[Product]:
    """AgentProducts.jsx catalog view, and the product picker in AgentSuppliers.jsx intake."""
    query = select(Product)
    if category:
        query = query.where(Product.category == category)
    if active_only:
        query = query.where(Product.active_status == True)  # noqa: E712
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def list_categories(db: AsyncSession) -> List[str]:
    """Category filter dropdown — distinct values in use."""
    result = await db.execute(select(distinct(Product.category)))
    return [row[0] for row in result.all()]


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    """
    No ownership check here (unlike buyer/supplier updates) — any agent
    can edit the shared catalog. Worth confirming that's actually
    intended rather than, say, Admin-only edit rights on products.
    """
    product = await get_product(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product
