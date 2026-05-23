import random
from twilio.rest import Client
from app.core.config import settings

def generate_otp(length=6):
    return ''.join([str(random.randint(0,9)) for _ in range(length)])

async def send_sms_otp(phone: str, otp: str):
    if settings.TWILIO_ACCOUNT_SID:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"Your Taskit OTP is {otp}",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone
        )
    else:
        # In development, just print
        print(f"OTP for {phone}: {otp}")