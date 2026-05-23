import os
# import openai # Uncomment when you install the openai package
# app/services/ai_service.py

import httpx
from typing import Optional, Tuple
from app.utils.knowledge_base import search_knowledge_base, build_system_prompt
from app.core.config import settings

# AI Configuration
AI_URL = "https://api.groq.com/openai/v1/chat/completions"
AI_MODEL = "llama-3.1-8b-instant"
AI_KEY = settings.GROQ_API_KEY


class AIService:
    
    @staticmethod
    async def query_groq(message: str) -> Optional[str]:
        """Query Groq API for AI response"""
        if not AI_KEY:
            print("[AIService] No API key found. Set GROQ_API_KEY in environment")
            return None
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    AI_URL,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {AI_KEY}",
                    },
                    json={
                        "model": AI_MODEL,
                        "max_tokens": 300,
                        "temperature": 0.3,
                        "messages": [
                            {"role": "system", "content": build_system_prompt()},
                            {"role": "user", "content": message},
                        ],
                    }
                )
                
                if response.status_code != 200:
                    print(f"[AIService] API error: {response.status_code}")
                    error_text = response.text[:200] if response.text else "No error details"
                    print(f"[AIService] Error details: {error_text}")
                    return None
                
                data = response.json()
                reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                
                if not reply or reply == "ESCALATE":
                    return None
                
                return reply
                
        except httpx.TimeoutException:
            print("[AIService] Request timeout")
            return None
        except Exception as e:
            print(f"[AIService] Unexpected error: {str(e)}")
            return None
    
    @staticmethod
    def query_knowledge_base(message: str) -> Optional[Tuple[str, str]]:
        """Search knowledge base for answer"""
        result = search_knowledge_base(message)
        if result:
            return (result["answer"], result["category"])
        return None
    
    @staticmethod
    async def get_ai_response(message: str) -> Tuple[str, str, bool, Optional[str]]:
        """
        Get response using tiered approach:
        1. Try AI (Groq)
        2. Fallback to Knowledge Base
        3. Finally human escalation
        
        Returns: (response_text, source, needs_escalation, category)
        """
        # Tier 1: AI (Groq)
        ai_response = await AIService.query_groq(message)
        if ai_response:
            return (ai_response, "ai", False, None)
        
        # Tier 2: Knowledge Base
        kb_result = AIService.query_knowledge_base(message)
        if kb_result:
            response_text, category = kb_result
            return (response_text, "kb", False, category)
        
        # Tier 3: Human escalation
        return (
            "I don't have an answer for that right now. A human from our team will get back to you shortly! Please provide your email address so we can contact you.",
            "human",
            True,
            None
        )

    @staticmethod
    async def analyze_review(comment: str) -> bool:
        """
        Analyzes the review text using AI.
        Returns True if the review is legitimate and safe.
        Returns False if it contains spam, extreme toxicity, or nonsense.
        """
        if not comment or len(comment.strip()) < 3:
            return True

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Fallback for MVP if no API key is present
            toxic_words = ["spam", "fake", "scam", "fuck", "shit", "bitch"]
            return not any(word in comment.lower() for word in toxic_words)

        # Actual OpenAI Implementation
        try:
            # openai.api_key = api_key
            # response = await openai.ChatCompletion.acreate(
            #     model="gpt-3.5-turbo",
            #     messages=[
            #         {"role": "system", "content": "You are a moderation AI. Reply ONLY with 'SAFE' or 'SPAM' based on the user's review of a domestic service provider."},
            #         {"role": "user", "content": comment}
            #     ],
            #     max_tokens=5,
            #     temperature=0.0
            # )
            # result = response.choices[0].message.content.strip().upper()
            # return result == "SAFE"
            
            return True # Remove this when uncommenting above
        except Exception as e:
            print(f"AI Error: {e}")
            return True # Default to verified if AI fails
        
