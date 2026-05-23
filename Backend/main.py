from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import (
    auth, users, providers, bookings,
    reviews, chat, categories, wallet,ai
)
from app.routers import admin as admin_router 

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(providers.router, prefix="/api/providers", tags=["Providers"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(wallet.router, prefix="/api/wallet", tags=["Wallet"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])

@app.get("/health")
async def health():
    return {"status": "ok"}