# app/schemas/ai.py

from pydantic import BaseModel, Field
from typing import Literal, Optional


class AIRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User's message to AI support")


class AIResponse(BaseModel):
    text: str = Field(..., description="Response text")
    source: Literal["ai", "kb", "human"] = Field(..., description="Source of the response")
    category: Optional[str] = Field(None, description="Category of the knowledge base response")
    needs_escalation: bool = Field(default=False, description="Whether human escalation is needed")


class AIHealthResponse(BaseModel):
    status: str
    ai_available: bool
    kb_available: bool
    knowledge_base_size: int