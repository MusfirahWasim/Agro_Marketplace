from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from decimal import Decimal

from app.models.booking import Booking
from app.models.provider import Provider, ProviderService
from app.models.user import User
from app.schemas.booking import BookingCreate
from app.utils.wallet import update_wallet_balance


class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_booking(self, user_id: int, data: BookingCreate):
        provider = await self.db.get(Provider, data.provider_id)
        if not provider:
            raise HTTPException(400, "Provider not found")

        booking = Booking(
            user_id=user_id,                 # customer's users.id
            provider_id=data.provider_id,    # providers.id
            service_id=data.service_id,
            address=data.address,
            scheduled_at=data.scheduled_at,
            description=data.description,
            status="requested",
        )

        self.db.add(booking)
        await self.db.commit()

        # Return fully loaded booking with provider.user_id included
        return await self.get_booking(booking.id)

    async def get_user_bookings(self, user_id: int, status: str = None):
        """
        Returns bookings where:
        - Booking.user_id == user_id (customer)
        OR
        - Booking.provider.user_id == user_id (provider's user account)

        Also injects:
        - booking.customer_user_id
        - booking.provider_user_id
        """

        stmt = (
            select(Booking)
            .outerjoin(Provider, Booking.provider_id == Provider.id)
            .options(
                # provider table + its linked user
                selectinload(Booking.provider).selectinload(Provider.user),
                # customer user
                selectinload(Booking.user),
                # booked service
                selectinload(Booking.service),
            )
            .where(
                or_(
                    Booking.user_id == user_id,   # customer
                    Provider.user_id == user_id,  # provider's users.id
                )
            )
            .order_by(Booking.created_at.desc())
        )

        if status:
            stmt = stmt.where(Booking.status == status)

        result = await self.db.execute(stmt)
        bookings = result.scalars().unique().all()

        # Expose flattened fields for the frontend:
        # booking.provider_user_id = 2
        # booking.customer_user_id = 1
        for booking in bookings:
            booking.customer_user_id = booking.user_id
            booking.provider_user_id = (
                booking.provider.user_id
                if booking.provider
                else None
            )

        return bookings

    async def get_booking(self, booking_id: int):
        """
        Return a single booking with:
        - booking.provider.user_id
        - booking.provider_user_id (flattened)
        - booking.customer_user_id (flattened)
        """

        stmt = (
            select(Booking)
            .options(
                selectinload(Booking.provider).selectinload(Provider.user),
                selectinload(Booking.user),
                selectinload(Booking.service),
            )
            .where(Booking.id == booking_id)
        )

        result = await self.db.execute(stmt)
        booking = result.scalar_one_or_none()

        if booking:
            booking.customer_user_id = booking.user_id
            booking.provider_user_id = (
                booking.provider.user_id
                if booking.provider
                else None
            )

        return booking

    async def update_status(
        self,
        booking_id: int,
        new_status: str,
        actor,
    ):
        booking = await self.get_booking(booking_id)

        if not booking:
            raise HTTPException(404, "Booking not found")

        customer_user_id = booking.user_id
        provider_user_id = booking.provider_user_id

        # Authorization: only customer or provider
        if actor.id not in [customer_user_id, provider_user_id]:
            raise HTTPException(403, "Not authorized")

        valid_statuses = [
            "requested",
            "accepted",
            "completed",
            "cancelled",
            "rejected",
        ]

        if new_status not in valid_statuses:
            raise HTTPException(400, "Invalid status")

        # Only provider can accept/reject
        if (
            new_status in ["accepted", "rejected"]
            and actor.id != provider_user_id
        ):
            raise HTTPException(
                403,
                "Only the service provider can accept or reject bookings",
            )

        # Only provider can mark complete
        if (
            new_status == "completed"
            and actor.id != provider_user_id
        ):
            raise HTTPException(
                403,
                "Only the service provider can mark the booking as completed",
            )

        # Only customer can cancel
        if (
            new_status == "cancelled"
            and actor.id != customer_user_id
        ):
            raise HTTPException(
                403,
                "Only the customer can cancel the booking",
            )

        # Wallet transfer when provider accepts booking
        if (
            new_status == "accepted"
            and booking.status == "requested"
        ):
            await self._process_wallet_on_accept(booking)

        booking.status = new_status

        await self.db.commit()

        # Return fully refreshed booking with computed fields
        return await self.get_booking(booking.id)

    async def _process_wallet_on_accept(self, booking: Booking):
        """
        Deduct service price from customer wallet and
        credit provider wallet.
        """

        # Load service
        service = await self.db.get(
            ProviderService,
            booking.service_id,
        )

        if not service:
            raise HTTPException(400, "Service not found")

        price = Decimal(str(service.price))

        # Customer
        customer = await self.db.get(User, booking.user_id)

        if Decimal(str(customer.wallet_balance)) < price:
            raise HTTPException(
                400,
                (
                    "Customer has insufficient wallet balance. "
                    f"Required: Rs.{price}, "
                    f"Available: Rs.{customer.wallet_balance}"
                ),
            )

        customer_new_balance = (
            Decimal(str(customer.wallet_balance)) - price
        )

        await update_wallet_balance(
            db=self.db,
            user_id=customer.id,
            amount=price,
            txn_type="debit",
            note=f"Payment for booking #{booking.id} — {service.title}",
            new_balance=customer_new_balance,
            booking_id=booking.id,
        )

        # Provider user account (users.id)
        provider_user = await self.db.get(
            User,
            booking.provider_user_id,
        )

        if not provider_user:
            raise HTTPException(400, "Provider user not found")

        provider_new_balance = (
            Decimal(str(provider_user.wallet_balance)) + price
        )

        await update_wallet_balance(
            db=self.db,
            user_id=provider_user.id,
            amount=price,
            txn_type="credit",
            note=f"Earnings from booking #{booking.id} — {service.title}",
            new_balance=provider_new_balance,
            booking_id=booking.id,
        )