from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.models.party import Party

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_party(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Party:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    # token payload carries both halves of the composite key —
    # see security.py: sub is party_id, party_type is its own claim
    party_id: str = payload.get("sub")
    party_type: str = payload.get("party_type")
    if party_id is None or party_type is None:
        raise credentials_exception

    result = await db.execute(
        select(Party).where(
            Party.party_id == int(party_id),
            Party.party_type == party_type,
        )
    )
    party = result.scalar_one_or_none()

    if party is None or not party.active_status:
        raise credentials_exception

    return party

def require_role(*allowed_types: str):
    """
    allowed_types uses the same codes as parties.party_type:
    'S' = supplier, 'B' = buyer, 'CA' = commission agent, 'A' = admin
    """
    async def role_checker(current_party: Party = Depends(get_current_party)):
        if current_party.party_type not in allowed_types:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_party
    return role_checker

# Convenience dependencies for the four roles — use these directly in routers
# instead of calling require_role(...) inline everywhere
require_supplier = require_role("S")
require_buyer = require_role("B")
require_agent = require_role("CA")
require_admin = require_role("A")