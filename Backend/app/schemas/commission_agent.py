from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class CommissionAgentRead(BaseModel):
    """
    Agent-specific fields only (commission_agents table). Combine with
    UserRead where a full profile is needed — e.g. AdminAgents.jsx wants
    name/email/active_status (from users) alongside commission_rate
    (from commission_agents).
    """
    model_config = ConfigDict(from_attributes=True)

    agent_id: int
    user_id: int
    commission_rate: Decimal
    created_at: datetime


class CommissionAgentProfile(CommissionAgentRead):
    """
    Combined view: agent's own profile fields plus the linked user
    fields, for AgentDashboard.jsx / ProfileSettings.jsx. Populated by
    the service layer joining commission_agents + users, not by the DB
    directly returning a nested shape.
    """
    user: UserRead


class CommissionAgentUpdate(BaseModel):
    """
    Admin-only update (AdminAgents.jsx) — adjusting an agent's default
    commission rate. Does not touch active_status; that's the approval/
    suspend toggle and lives on UserAdminUpdate (users table) instead.
    """
    commission_rate: Optional[Decimal] = None