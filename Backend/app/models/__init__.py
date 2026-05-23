# app/models/__init__.py
from app.models.user import User
from app.models.otp_token import OTPToken
from app.models.address import Address
from app.models.category import Category
from app.models.provider import Provider, ProviderService
from app.models.booking import Booking
from app.models.review import Review
from app.models.chat import Chat, ChatMessage

# These might be missing - we'll create them
try:
    from app.models.subscription import SubscriptionPlan, ProviderSubscription
except ImportError:
    pass

try:
    from app.models.promo import PromoCode, PromoCodeUsage
except ImportError:
    pass

try:
    from app.models.report import Report
except ImportError:
    pass

try:
    from app.models.ai_log import AIMatchLog
except ImportError:
    pass

try:
    from app.models.settings import PlatformSetting
except ImportError:
    pass

try:
    from app.models.service_area import ServiceArea, ProviderServiceArea
except ImportError:
    pass

try:
    from app.models.calendar_sync import CalendarSyncToken
except ImportError:
    pass

try:
    from app.models.loyalty import UserLoyaltyPoints
except ImportError:
    pass

try:
    from app.models.referral import Referral
except ImportError:
    pass

try:
    from app.models.boost import ListingBoost
except ImportError:
    pass

__all__ = [
    "AdminUser",
    "User",
    "OTPToken",
    "Address",
    "Category",
    "Subcategory",
    "Provider",
    "ProviderService",
    "ProviderAvailability",
    "ProviderAvailabilityOverride",
    "ProviderDocument",
    "Badge",
    "ProviderBadge",
    "Booking",
    "BookingStatusHistory",
    "JobPhoto",
    "Payment",
    "WalletTransaction",
    "Earning",
    "WithdrawalRequest",
    "Invoice",
    "Review",
    "ReviewHelpfulVote",
    "Chat",
    "ChatMessage",
    "Dispute",
    "DisputeMessage",
    "Notification",
]