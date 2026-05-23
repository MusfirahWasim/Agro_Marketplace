from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.provider import Provider, ProviderService as ProviderServiceModel
from fastapi import HTTPException
from geopy.distance import geodesic

class ProviderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_providers(
        self,
        lat: float,
        lng: float,
        category_id: int = None,
        max_distance_km: float = 10.0
    ):
        stmt = (
            select(Provider)
            .options(
                selectinload(Provider.services),
                selectinload(Provider.user)
            )
        )

        if category_id:
            stmt = (
                stmt.join(ProviderServiceModel)
                .where(ProviderServiceModel.category_id == category_id)
            )

        result = await self.db.execute(stmt)

        providers = result.scalars().unique().all()

        filtered = []

        for p in providers:
            if p.lat and p.lng:
                dist = geodesic(
                    (lat, lng),
                    (float(p.lat), float(p.lng))
                ).km

                if dist <= max_distance_km and dist <= p.service_radius_km:
                    provider_dict = {
                        "id": p.id,
                        "user_id": p.user_id,
                        "full_name": p.user.full_name if p.user else None,
                        "bio": p.bio,
                        "lat": float(p.lat),
                        "lng": float(p.lng),
                        "distance": round(dist, 2),
                        "service_radius_km": float(p.service_radius_km),
                        "is_featured": p.is_featured,
                        "years_of_experience": p.years_of_experience,
                        "created_at": p.created_at,
                        "updated_at": p.updated_at,

                        "services": [
                            {
                                "id": s.id,
                                "title": s.title,
                                "description": s.description,
                                "price": float(s.price),
                                "category_id": s.category_id
                            }
                            for s in p.services
                        ]
                    }

                    filtered.append(provider_dict)

        filtered.sort(key=lambda x: x["distance"])

        return filtered

    async def get_provider_details(self, provider_id: int):
        stmt = select(Provider).where(Provider.id == provider_id)
        provider = (await self.db.execute(stmt)).scalar_one_or_none()
        if not provider:
            raise HTTPException(404, "Provider not found")
        return provider

    async def get_provider_by_user(self, user_id: int):
        stmt = (
            select(Provider)
            .options(selectinload(Provider.services))
            .where(Provider.user_id == user_id)
        )

        provider = (await self.db.execute(stmt)).scalar_one_or_none()

        if not provider:
            raise HTTPException(404, "Provider profile not found")

        return provider

    async def create_service(self, provider_id: int, data):
        service = ProviderServiceModel(provider_id=provider_id, **data.model_dump())
        self.db.add(service)
        await self.db.commit()
        await self.db.refresh(service)
        return service
    
    async def get_all_services(self, skip: int = 0, limit: int = 100):
        query = select(ProviderServiceModel).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update_location(self, provider_id: int, lat: float, lng: float):
            provider = await self.db.get(Provider, provider_id)
            if not provider:
                raise HTTPException(404, "Provider not found")
            
            provider.lat = lat
            provider.lng = lng
            await self.db.commit()
            await self.db.refresh(provider)
            return provider