# app/utils/knowledge_base.py

KNOWLEDGE_BASE = [
    {
        "id": 1,
        "category": "Bookings",
        "keywords": ["book", "booking", "hire", "request", "service", "schedule"],
        "question": "How do I book a service?",
        "answer": "Go to 'Find Services', browse available providers, and click 'Book Now' on any service card. Fill in your address, preferred date/time, and a description of what you need. You must be logged in to book.",
    },
    {
        "id": 2,
        "category": "Bookings",
        "keywords": ["cancel", "cancellation", "undo", "remove booking"],
        "question": "How do I cancel a booking?",
        "answer": "You can cancel a booking from the 'My Bookings' page. Click 'Cancel Request' — this is only available while the booking is still in 'Requested' status. Once a provider accepts, cancellation is no longer available from the app.",
    },
    {
        "id": 3,
        "category": "Bookings",
        "keywords": ["status", "accepted", "completed", "rejected", "pending", "requested"],
        "question": "What do the booking statuses mean?",
        "answer": "Requested: your booking is waiting for the provider to respond. Accepted: the provider confirmed and is on the way. Completed: the job is done. Cancelled: you cancelled the request. Rejected: the provider declined.",
    },
    {
        "id": 4,
        "category": "Bookings",
        "keywords": ["complete", "mark complete", "finish", "done", "job done"],
        "question": "Who marks a booking as completed?",
        "answer": "The provider marks the booking as completed from their dashboard once the job is done. After that, you (the customer) will be able to leave a review.",
    },
    {
        "id": 5,
        "category": "Reviews",
        "keywords": ["review", "rating", "stars", "feedback", "rate", "leave review"],
        "question": "How do I leave a review?",
        "answer": "Once your booking is marked as completed, a 'Leave Review' button appears on that booking in 'My Bookings'. You can give a star rating (1–5) and write a comment.",
    },
    {
        "id": 6,
        "category": "Reviews",
        "keywords": ["verified", "ai verified", "review verified", "is_verified"],
        "question": "What does AI Verified mean on a review?",
        "answer": "When you submit a review, our AI automatically analyzes the comment for quality and authenticity. If it passes, it gets marked as 'AI Verified', which helps other customers trust the feedback.",
    },
    {
        "id": 7,
        "category": "Providers",
        "keywords": ["become provider", "offer service", "register provider", "provider account", "how to provide"],
        "question": "How do I become a provider on Taskit?",
        "answer": "During registration, select 'Provider' or 'Both' as your role. After registering, go to your Profile to set your location, then go to 'Manage Services' to add the services you offer with pricing.",
    },
    {
        "id": 8,
        "category": "Providers",
        "keywords": ["location", "set location", "visible", "nearby", "gps", "coordinates"],
        "question": "Why am I not showing up in searches?",
        "answer": "Providers must set their location to appear in customer searches. Go to your Profile page and click 'Auto-Detect & Save' under Location Coordinates. Without this, your services won't show in nearby results.",
    },
    {
        "id": 9,
        "category": "Providers",
        "keywords": ["add service", "manage service", "create service", "list service", "pricing"],
        "question": "How do I add a service as a provider?",
        "answer": "Go to 'Manage Services' from your dashboard. Click 'Add Service', fill in the title, description, category, and your base price, then save. Your service will immediately appear in Find Services for customers.",
    },
    {
        "id": 10,
        "category": "Account",
        "keywords": ["login", "sign in", "password", "forgot password", "cant login"],
        "question": "I can't log in to my account.",
        "answer": "Make sure you're using the correct email and password. Passwords are case-sensitive. If you've forgotten your password, use the forgot password option on the login page. If the issue persists, contact support.",
    },
    {
        "id": 11,
        "category": "Account",
        "keywords": ["register", "sign up", "create account", "new account"],
        "question": "How do I create an account?",
        "answer": "Click 'Register' on the top navigation. Fill in your full name, email, phone number, and choose your role (Customer, Provider, or Both). After registering you can immediately start using Taskit.",
    },
    {
        "id": 12,
        "category": "Chat",
        "keywords": ["chat", "message", "contact provider", "talk to provider", "communicate"],
        "question": "How do I chat with my provider?",
        "answer": "Once a booking is in 'Requested' or 'Accepted' status, a 'Chat' button appears on that booking in 'My Bookings'. Click it to open a real-time chat with your provider.",
    },
    {
        "id": 13,
        "category": "Payments",
        "keywords": ["payment", "pay", "price", "cost", "charge", "fee", "money"],
        "question": "How does payment work?",
        "answer": "Taskit currently operates on a cash-on-delivery model. You agree on the base price shown on the service listing and pay the provider directly after the job is completed.",
    },
    {
        "id": 14,
        "category": "General",
        "keywords": ["what is taskit", "about taskit", "how does taskit work", "platform"],
        "question": "What is Taskit?",
        "answer": "Taskit is a service marketplace that connects customers with local service providers. You can find, book, and review services like cleaning, plumbing, electrical work, and more — all in one place.",
    },
    {
        "id": 15,
        "category": "General",
        "keywords": ["categories", "services available", "what services", "types of service"],
        "question": "What types of services are available?",
        "answer": "Taskit offers a range of home and local services including cleaning, plumbing, electrical work, appliance installation, and more. Browse all available services on the 'Find Services' page.",
    },
]


def search_knowledge_base(message: str) -> dict | None:
    """Search knowledge base by keyword matching"""
    lower = message.lower()
    words = set(word for word in lower.split() if word.isalnum())
    
    best = None
    best_score = 0
    
    for entry in KNOWLEDGE_BASE:
        score = sum(1 for kw in entry["keywords"] if kw in lower or kw in words)
        if score > best_score:
            best_score = score
            best = entry
    
    if best_score >= 1:
        return {
            "answer": best["answer"],
            "question": best["question"],
            "category": best["category"]
        }
    return None


def build_system_prompt() -> str:
    """Build system prompt with knowledge base context"""
    kb_text = "\n\n".join([f"Q: {e['question']}\nA: {e['answer']}" for e in KNOWLEDGE_BASE])
    
    return f"""You are Taskit's friendly customer support assistant.

ABOUT TASKIT:
- Pakistani home services marketplace at taskit.pk
- Connects customers with local providers for cleaning, plumbing, electrical, appliance work
- Available in Karachi, Lahore, Islamabad
- Languages: customers will write in English always reply in English

ROLES:
- Customer: browses Find Services, books providers, chats, pays cash, leaves reviews
- Provider: registers, sets GPS location, lists services with prices, accepts/rejects bookings
- Both roles can be held by one account

BOOKING FLOW:
Requested → Accepted → Completed (provider marks done) → Review available
Or: Requested → Cancelled (by customer) / Rejected (by provider)

PAYMENT: Cash on delivery. No online payment. Customer pays provider directly.

CONTACT & ESCALATION:
- Email: support@taskit.pk
- If you cannot answer, say ESCALATE — do not guess

TONE:
- Warm, concise, 2–4 sentences max
- Never invent features or policies not listed here
- Always reply in English only, regardless of what language the user writes in
- DONT REPLY TO ANY QUESTION IN URDU
- Only answer queries related to taskit dont answer to any irrelevant topic

KNOWLEDGE BASE:
{kb_text}"""