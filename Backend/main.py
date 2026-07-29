from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine
import app.models  # noqa: F401 — registers every model so relationship("...") string refs resolve
from app.routers import auth, party, supply, consignment, order, payment, account, commission, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # verify the DB is actually reachable on startup, not just that the
    # engine object was created (create_async_engine doesn't connect eagerly)
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    print("Database connection OK")
    try:
        yield
    finally:
        await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers — prefix/tags are declared on each router itself (see
# routers/auth.py), so nothing extra is passed here
app.include_router(auth.router)
app.include_router(party.router)
app.include_router(supply.router)
app.include_router(consignment.router)
app.include_router(order.router)
app.include_router(payment.router)
app.include_router(account.router)
app.include_router(commission.router)
app.include_router(admin.router)

@app.get("/health")
async def health():
    return {"status": "ok"}