from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine
import app.models  # noqa: F401 — registers every model so relationship("...") string refs resolve
from app.routers import (
    auth,
    admin,
    buyer,
    supplier,
    product,
    supplier_supply,
    consignment,
    sale,
    commission,
    account,
    payment,
    receipt,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify the database is reachable
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
        print("Database connection OK")

        # List all tables
        result = await conn.execute(text("SHOW TABLES"))
        tables = result.fetchall()

        print("\nTables in database:")
        if tables:
            for table in tables:
                print(f" - {table[0]}")
        else:
            print("No tables found.")

    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
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

# Routers — prefix/tags are declared on each router itself (see e.g.
# routers/auth.py), so nothing extra is passed here. party/supply/order
# from v1 are gone entirely (see buyer+supplier, supplier_supply, sale).
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(buyer.router)
app.include_router(supplier.router)
app.include_router(product.router)
app.include_router(supplier_supply.router)
app.include_router(consignment.router)
app.include_router(sale.router)
app.include_router(commission.router)
app.include_router(account.router)
app.include_router(payment.router)
app.include_router(receipt.router)


@app.get("/")
async def health():
    return {"status": "ok"}