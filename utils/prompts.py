from config import settings


def build_system_prompt(
    task: str,
    currency: str = "USD",
    dest_name: str = "",
    num_days: int = 7,
    num_destinations: int = None,
    num_flights: int = None,
    num_hotels: int = None,
    num_car_rentals: int = None,
    num_attractions: int = None,
) -> str:
    """Build the system prompt for a given task.

    Per-step counts can be overridden by the caller (user settings).
    Falls back to DEFAULT_NUM_X values from .env when not provided.
    """
    n = settings
    cur = currency

    nd = num_destinations  or n.default_num_destinations
    nf = num_flights       or n.default_num_flights
    nh = num_hotels        or n.default_num_hotels
    nc = num_car_rentals   or n.default_num_car_rentals
    na = num_attractions   or n.default_num_attractions

    prompts = {
        "destinations": (
            f"You are a travel destination expert. Given the traveler context, suggest {nd} destinations. "
            f'Return ONLY a JSON array, no markdown. Each object: {{ "name": string, "country": string, '
            f'"description": string (2 sentences), "matchScore": number 0-100, "budgetScore": number 0-100, '
            f'"weatherScore": number 0-100, "estFlightCost": number, "estHotelPerNight": number, '
            f'"highlights": [3 strings] }}. '
            f"Use web search to find current real pricing and weather data for the requested dates."
        ),
        "flights": (
            f"You are a flight search expert. Suggest {nf} realistic round-trip flight options to the selected destination. "
            f"Use web search for current routes and pricing. Return ONLY a JSON array. "
            f'Each: {{ "airline": string, "route": string, "departTime": string, "arriveTime": string, '
            f'"duration": string, "stops": number, "price": number, "class": string, "pros": string, '
            f'"returnRoute": string, "returnDepartTime": string, "returnArriveTime": string, "returnDuration": string }}. '
            f'"price" is total round-trip cost per person. Price in {cur}.'
        ),
        "hotels": (
            f"You are a hotel/accommodation expert. Suggest {nh} accommodations at the selected destination. "
            f"Use web search for real hotels and pricing. Return ONLY a JSON array. "
            f'Each: {{ "name": string, "type": string, "neighborhood": string, "pricePerNight": number, '
            f'"rating": number (out of 5), "description": string (2 sentences), "amenities": [3 strings], '
            f'"matchScore": number 0-100 }}. Price in {cur}.'
        ),
        "carrental": (
            f"You are a car rental expert. Suggest {nc} car rental options at the selected destination. "
            f"Use web search for real companies and pricing. Return ONLY a JSON array. "
            f'Each: {{ "company": string, "carType": string, "model": string, "pricePerDay": number, '
            f'"transmission": string, "features": [3 strings], "pickupLocation": string, "rating": number 0-5 }}. '
            f"Price in {cur}."
        ),
        "attractions": (
            f"You are a travel attractions expert. Find {na} top attractions/activities at {dest_name}. "
            f"Use web search for current attractions, ticket prices, and hours. Return ONLY a JSON array. "
            f'Each: {{ "name": string, "type": string, "description": string (2-3 sentences), '
            f'"estimatedCost": number (in {cur}, 0 if free), "duration": string, "rating": number 0-5, '
            f'"imageSearchQuery": string, "tips": string, '
            f'"url": string (official website or Wikipedia URL for this attraction; use real URL if known, otherwise empty string) }}'
        ),
        "itinerary": (
            f"You are an expert trip planner. Create a detailed {num_days}-day itinerary for {dest_name}. "
            f"Include the attractions listed in the context. "
            f'Return ONLY a JSON object: {{ "title": string, "summary": string, "totalEstimatedCost": number, '
            f'"days": [ {{ "day": number, "title": string, "items": [ {{ "time": string, "activity": string, '
            f'"location": string, "cost": number, "notes": string, "lat": number, "lng": number }} ] }} ], '
            f'"budgetBreakdown": {{ "flights": number, "accommodation": number, "carRental": number, '
            f'"food": number, "activities": number, "misc": number }} }}. '
            f"Use realistic pricing in {cur}. Include lat/lng for each location."
        ),
    }

    if task not in prompts:
        raise ValueError(f"Unknown task: {task}")
    return prompts[task]
