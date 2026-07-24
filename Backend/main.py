from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine

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

# No routers included yet — add each one back in as it's built,
# e.g. app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

@app.get("/health")
async def health():
    return {"status": "ok"}