# app/routers/ai.py

from fastapi import APIRouter, HTTPException, status
from app.schemas.ai import AIRequest, AIResponse, AIHealthResponse
from app.services.ai_services import AIService
from app.utils.knowledge_base import KNOWLEDGE_BASE
import os
from app.core.config import settings

router = APIRouter()

@router.post("/support", response_model=AIResponse)
async def ai_support(request: AIRequest):
    """
    Send a message to Taskit AI Support.
    Uses tiered approach: AI (Groq) → Knowledge Base → Human escalation
    """
    try:
        response_text, source, needs_escalation, category = await AIService.get_ai_response(request.message)
        
        return AIResponse(
            text=response_text,
            source=source,
            category=category,
            needs_escalation=needs_escalation
        )
    except Exception as e:
        print(f"[AIRouter] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process AI support request"
        )


@router.get("/health", response_model=AIHealthResponse)
async def ai_health():
    """Check AI service health"""
    ai_available = bool(settings.GROQ_API_KEY)
    
    return AIHealthResponse(
        status="healthy",
        ai_available=ai_available,
        kb_available=True,  # KB always available
        knowledge_base_size=len(KNOWLEDGE_BASE)
    )


@router.get("/knowledge-base/search")
async def search_knowledge_base_endpoint(q: str):
    """Search knowledge base directly (useful for debugging)"""
    from app.utils.knowledge_base import search_knowledge_base
    
    result = search_knowledge_base(q)
    if result:
        return {
            "found": True,
            "question": result["question"],
            "answer": result["answer"],
            "category": result["category"]
        }
    return {"found": False, "message": "No matching entry found"}