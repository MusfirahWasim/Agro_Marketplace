from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException
from app.models.address import Address
from app.schemas.user import AddressCreate

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_addresses(self, user_id: int):
        stmt = select(Address).where(Address.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_address(self, user_id: int, data: AddressCreate):
        if data.is_default:
            await self.db.execute(
                update(Address).where(Address.user_id == user_id).values(is_default=False)
            )
        address = Address(user_id=user_id, **data.model_dump())
        self.db.add(address)
        await self.db.commit()
        await self.db.refresh(address)
        return address

    async def update_address(self, address_id: int, user_id: int, data: AddressCreate):
        stmt = select(Address).where(Address.id == address_id, Address.user_id == user_id)
        result = await self.db.execute(stmt)
        address = result.scalar_one_or_none()
        if not address:
            raise HTTPException(404, "Address not found")
        for key, value in data.model_dump().items():
            setattr(address, key, value)
        await self.db.commit()
        await self.db.refresh(address)
        return address

    async def delete_address(self, address_id: int, user_id: int):
        stmt = select(Address).where(Address.id == address_id, Address.user_id == user_id)
        result = await self.db.execute(stmt)
        address = result.scalar_one_or_none()
        if address:
            await self.db.delete(address)
            await self.db.commit()