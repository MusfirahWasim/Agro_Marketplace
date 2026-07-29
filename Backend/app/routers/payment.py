from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_party, require_role
from app.models.party import Party
from app.schemas.payment import PaymentCreate, PaymentRead
from app.services import payment_service, order_service

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Admin doesn't make or receive payments in this system — only S/B/CA do
require_payer = require_role("S", "B", "CA")


@router.post("/", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: PaymentCreate,
    payer: Party = Depends(require_payer),
    db: AsyncSession = Depends(get_db),
):
    """
    Covers all three flows through one endpoint: buyer paying an agent,
    agent settling a supplier, or a refund — payer is always whoever is
    authenticated, never accepted from the request body.
    """
    return await payment_service.create_payment(db, payer, data)


@router.get("/me", response_model=List[PaymentRead])
async def list_my_payments(
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    Either side of a payment — powers SupplierPayments.jsx,
    AgentSettlements.jsx, and BuyerPayments.jsx, each just hitting this
    same endpoint as their own party.
    """
    return await payment_service.list_payments_for_party(
        db, current_party.party_id, current_party.party_type
    )


@router.get("/order/{order_id}", response_model=List[PaymentRead])
async def list_payments_for_order(
    order_id: int,
    current_party: Party = Depends(get_current_party),
    db: AsyncSession = Depends(get_db),
):
    """
    All payments tied to a specific order — e.g. a partial payment plus
    a later refund would both show up here. Only the buyer who placed
    it, the agent who owns its consignment, or an admin can view this.
    """
    order = await order_service.get_order(db, order_id)
    await order_service.verify_order_access(db, order, current_party)
    return await payment_service.list_payments_for_order(db, order_id)