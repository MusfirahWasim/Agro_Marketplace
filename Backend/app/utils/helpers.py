import random
import string
from datetime import datetime, timedelta

def generate_booking_ref():
    return f"TK-{datetime.now().strftime('%Y%m')}{random.randint(100000,999999)}"

def calculate_distance(lat1, lon1, lat2, lon2):
    from geopy.distance import geodesic
    return geodesic((lat1, lon1), (lat2, lon2)).km