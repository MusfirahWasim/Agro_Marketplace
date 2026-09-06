from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_agent
from app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.services import product_service

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.post("", response_model=ProductRead, status_code=201)
async def create_product(
    data: ProductCreate,
    _agent=Depends(get_current_agent),  # any agent may add to the shared catalog
    db: AsyncSession = Depends(get_db),
):
    """AgentProducts.jsx — shared catalog, no agent_id on the row itself."""
    return await product_service.create_product(db, data)


@router.get("", response_model=List[ProductRead])
async def list_products(
    _agent=Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
):
    """AgentProducts.jsx catalog view, and the product picker in AgentSuppliers.jsx intake."""
    return await product_service.list_products(db, category, active_only, skip, limit)


@router.get("/categories", response_model=List[str])
async def list_categories(
    _agent=Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Category filter dropdown."""
    return await product_service.list_categories(db)


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: int,
    _agent=Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    return await product_service.get_product(db, product_id)


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    _agent=Depends(get_current_agent),  # no ownership check — any agent can edit; see product_service.py note
    db: AsyncSession = Depends(get_db),
):
    return await product_service.update_product(db, product_id, data)
