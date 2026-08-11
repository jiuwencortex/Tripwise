"""
Debug service — returns pre-canned mock data immediately, with no external calls.
Simulates the same SSE event flow as real services so the frontend behaves identically.

Mock trip: Paris → Barcelona, 2 travelers (1 adult + 1 child), June 1-3 2026, USD budget.
"""

import asyncio
import json
from typing import AsyncGenerator

# ── Mock destinations ────────────────────────────────────────────────────────
_DESTINATIONS = [
    {
        "name": "Barcelona",
        "country": "Spain",
        "description": "A vibrant coastal city renowned for Gaudí's architecture and world-class cuisine. Perfect blend of culture, beaches, and nightlife for all ages.",
        "matchScore": 95,
        "budgetScore": 72,
        "weatherScore": 88,
        "estFlightCost": 120,
        "estHotelPerNight": 90,
        "highlights": ["Sagrada Família", "Las Ramblas", "Barceloneta Beach"],
    },
    {
        "name": "Lisbon",
        "country": "Portugal",
        "description": "Europe's sunniest capital with historic trams, stunning viewpoints, and affordable prices. A charming city of fado music and Atlantic soul.",
        "matchScore": 87,
        "budgetScore": 85,
        "weatherScore": 82,
        "estFlightCost": 110,
        "estHotelPerNight": 75,
        "highlights": ["Alfama District", "Belém Tower", "Time Out Market"],
    },
]

# ── Mock flights ─────────────────────────────────────────────────────────────
_FLIGHTS = [
    {
        "airline": "Vueling Airlines",
        "route": "Paris CDG → Barcelona BCN",
        "departTime": "08:15",
        "arriveTime": "10:20",
        "duration": "2h 05m",
        "stops": 0,
        "price": 98,
        "class": "Economy",
        "pros": "Cheapest direct option, early morning departure leaves a full day on arrival",
        "returnRoute": "Barcelona BCN → Paris CDG",
        "returnDepartTime": "18:45",
        "returnArriveTime": "20:55",
        "returnDuration": "2h 10m",
    },
    {
        "airline": "Air France",
        "route": "Paris CDG → Barcelona BCN",
        "departTime": "13:40",
        "arriveTime": "15:50",
        "duration": "2h 10m",
        "stops": 0,
        "price": 145,
        "class": "Economy Flex",
        "pros": "Flexible ticket with free rebooking, complimentary meal, and extra leg-room option",
        "returnRoute": "Barcelona BCN → Paris CDG",
        "returnDepartTime": "20:15",
        "returnArriveTime": "22:30",
        "returnDuration": "2h 15m",
    },
]

# ── Mock hotels ──────────────────────────────────────────────────────────────
_HOTELS = [
    {
        "name": "Hotel Arts Barcelona",
        "type": "Luxury Hotel",
        "neighborhood": "Barceloneta, Port Olímpic",
        "pricePerNight": 280,
        "rating": 4.8,
        "description": "Iconic 44-floor beachfront tower with panoramic Mediterranean views and a Michelin-starred restaurant. World-class spa, two outdoor pools, and direct beach access.",
        "amenities": ["Rooftop Infinity Pool", "Spa & Wellness Centre", "Beachfront Access"],
        "matchScore": 88,
    },
    {
        "name": "Casa Fuster Hotel",
        "type": "Boutique Hotel",
        "neighborhood": "Gràcia, Passeig de Gràcia",
        "pricePerNight": 180,
        "rating": 4.6,
        "description": "A stunning 1908 Modernista palace beautifully restored into a five-star boutique hotel. Steps from Gaudí landmarks, with a celebrated jazz bar and rooftop terrace.",
        "amenities": ["Rooftop Terrace Bar", "Live Jazz Nights", "Historic Modernista Architecture"],
        "matchScore": 92,
    },
]

# ── Mock car rentals ─────────────────────────────────────────────────────────
_CAR_RENTALS = [
    {
        "company": "Europcar",
        "carType": "Compact",
        "model": "Volkswagen Golf",
        "pricePerDay": 45,
        "transmission": "Automatic",
        "features": ["GPS Navigation", "Air Conditioning", "Bluetooth Audio"],
        "pickupLocation": "Barcelona Airport T1",
        "rating": 4.3,
    },
    {
        "company": "Sixt",
        "carType": "SUV",
        "model": "SEAT Tarraco",
        "pricePerDay": 72,
        "transmission": "Automatic",
        "features": ["GPS Navigation", "Panoramic Roof", "Rear Parking Sensors"],
        "pickupLocation": "Barcelona Airport T1",
        "rating": 4.5,
    },
]

# ── Mock attractions ─────────────────────────────────────────────────────────
_ATTRACTIONS = [
    {
        "name": "Sagrada Família",
        "type": "Landmark / Architecture",
        "description": "Antoni Gaudí's unfinished masterpiece and the most-visited monument in Spain. The soaring basilica blends Gothic and Art Nouveau styles in breathtaking detail. Towers offer panoramic views over the city.",
        "estimatedCost": 26,
        "duration": "2-3 hours",
        "rating": 4.9,
        "imageSearchQuery": "Sagrada Familia Barcelona exterior",
        "tips": "Book tickets online 2-3 months in advance. Visit at opening (09:00) to avoid queues.",
        "url": "https://www.sagradafamilia.org/en/",
        "lat": 41.4036,
        "lng": 2.1744,
    },
    {
        "name": "Park Güell",
        "type": "Park / Architecture",
        "description": "A UNESCO World Heritage park designed by Gaudí, filled with mosaic sculptures, winding pathways, and the famous dragon staircase. The Monumental Zone offers sweeping views of the city and harbour.",
        "estimatedCost": 10,
        "duration": "2 hours",
        "rating": 4.7,
        "imageSearchQuery": "Park Guell Barcelona mosaic terrace",
        "tips": "Book the Monumental Zone timed-entry slot online. Arrive early for photos without crowds.",
        "url": "https://parkguell.barcelona/en/",
        "lat": 41.4145,
        "lng": 2.1527,
    },
    {
        "name": "Gothic Quarter Walking Tour",
        "type": "Cultural / Walking",
        "description": "A labyrinth of medieval streets dating back to Roman times, home to the Barcelona Cathedral, ancient temples, and hidden plazas. The quarter hides some of the city's best tapas bars and independent boutiques.",
        "estimatedCost": 15,
        "duration": "3 hours",
        "rating": 4.6,
        "imageSearchQuery": "Barcelona Gothic Quarter narrow streets",
        "tips": "Wear comfortable shoes. Morning light makes for beautiful photography. Self-guided or join a free walking tour.",
        "url": "",
        "lat": 41.3826,
        "lng": 2.1769,
    },
    {
        "name": "La Boqueria Market",
        "type": "Food & Market",
        "description": "Barcelona's legendary covered market on La Rambla, bursting with colourful stalls of fresh fruit, seafood, cured meats, and local cheeses. A feast for all the senses and perfect for a gourmet breakfast.",
        "estimatedCost": 20,
        "duration": "1-2 hours",
        "rating": 4.5,
        "imageSearchQuery": "La Boqueria market Barcelona fruit stalls",
        "tips": "Visit before 10:00 for the freshest produce and fewest tourists. Try the fresh fruit smoothie bars.",
        "url": "https://www.boqueria.barcelona/",
        "lat": 41.3817,
        "lng": 2.1716,
    },
    {
        "name": "Camp Nou Experience",
        "type": "Sports / Museum",
        "description": "Tour the legendary home of FC Barcelona — the largest football stadium in Europe. Explore the museum's trophies, interactive exhibits, and walk through the players' tunnel onto the pitch.",
        "estimatedCost": 28,
        "duration": "2 hours",
        "rating": 4.5,
        "imageSearchQuery": "Camp Nou Barcelona stadium tour",
        "tips": "Book online for a discount. Combine with a match day for the full atmosphere. Avoid Sunday mornings when tour demand is highest.",
        "url": "https://www.fcbarcelona.com/en/tickets/camp-nou-experience",
        "lat": 41.3809,
        "lng": 2.1228,
    },
]

# ── Mock itinerary ────────────────────────────────────────────────────────────
_ITINERARY = {
    "title": "Barcelona City Break — 2 Days",
    "summary": "A perfectly curated 2-day break in Barcelona covering Gaudí's architectural marvels, the ancient Gothic Quarter, the legendary Boqueria Market, and the iconic Camp Nou. Ideal for a mixed adult-child party with a balance of culture, food, and fun.",
    "totalEstimatedCost": 396,
    "days": [
        {
            "day": 1,
            "title": "Gaudí Wonders & Gothic Quarter",
            "items": [
                {
                    "time": "09:00",
                    "activity": "Sagrada Família visit",
                    "location": "Sagrada Família, Eixample",
                    "cost": 52,
                    "notes": "Booked timed-entry tickets for 09:00 opening. Take the tower lift for panoramic views.",
                    "lat": 41.4036,
                    "lng": 2.1744,
                },
                {
                    "time": "12:00",
                    "activity": "Lunch at Cervecería Catalana",
                    "location": "Carrer de Mallorca 236, Eixample",
                    "cost": 35,
                    "notes": "Excellent pintxos and tapas. Great for kids — try the croquetas.",
                    "lat": 41.3927,
                    "lng": 2.1629,
                },
                {
                    "time": "13:30",
                    "activity": "Gothic Quarter Walking Tour",
                    "location": "Gothic Quarter, Barri Gòtic",
                    "cost": 30,
                    "notes": "Start at Plaça de Catalunya. Explore the Roman temple ruins and Barcelona Cathedral. Wear comfortable shoes.",
                    "lat": 41.3826,
                    "lng": 2.1769,
                },
                {
                    "time": "16:30",
                    "activity": "La Boqueria Market browse & snack",
                    "location": "La Boqueria Market, La Rambla",
                    "cost": 20,
                    "notes": "Pick up fresh fruit, local cheeses, and jamón. Kids love the colourful candy stalls.",
                    "lat": 41.3817,
                    "lng": 2.1716,
                },
                {
                    "time": "19:00",
                    "activity": "Check-in at hotel & freshen up",
                    "location": "Hotel Arts Barcelona, Barceloneta",
                    "cost": 0,
                    "notes": "Request an upper-floor room for sea views.",
                    "lat": 41.3878,
                    "lng": 2.1964,
                },
                {
                    "time": "20:30",
                    "activity": "Dinner at Barceloneta waterfront",
                    "location": "Barceloneta Beach promenade",
                    "cost": 50,
                    "notes": "Try fresh paella or fideuà at one of the seafront restaurants. Sunset over the Mediterranean.",
                    "lat": 41.3789,
                    "lng": 2.1902,
                },
            ],
        },
        {
            "day": 2,
            "title": "Park Güell, Camp Nou & Departure",
            "items": [
                {
                    "time": "08:30",
                    "activity": "Breakfast at La Boqueria",
                    "location": "La Boqueria Market, La Rambla",
                    "cost": 18,
                    "notes": "Fresh fruit juices and pastries. Arrive early to beat the tourist rush.",
                    "lat": 41.3817,
                    "lng": 2.1716,
                },
                {
                    "time": "10:00",
                    "activity": "Park Güell — Monumental Zone",
                    "location": "Park Güell, Gràcia",
                    "cost": 20,
                    "notes": "Timed entry at 10:00. The mosaic terrace and dragon staircase are highlights. Great city views.",
                    "lat": 41.4145,
                    "lng": 2.1527,
                },
                {
                    "time": "12:30",
                    "activity": "Lunch in Gràcia neighbourhood",
                    "location": "Plaça de la Vila de Gràcia, Gràcia",
                    "cost": 28,
                    "notes": "Charming local neighbourhood. Try bocadillos or a set menu at any of the terrace restaurants.",
                    "lat": 41.4023,
                    "lng": 2.1570,
                },
                {
                    "time": "14:30",
                    "activity": "Camp Nou Experience tour",
                    "location": "Camp Nou Stadium, Les Corts",
                    "cost": 56,
                    "notes": "2-person ticket (adult + child). Kids love the players' tunnel and interactive museum exhibits.",
                    "lat": 41.3809,
                    "lng": 2.1228,
                },
                {
                    "time": "17:00",
                    "activity": "Hotel checkout & transfer to airport",
                    "location": "Barcelona Airport T1",
                    "cost": 35,
                    "notes": "Allow 45 min for taxi/Aerobus to T1. Check-in opens 2h before Vueling departure.",
                    "lat": 41.2974,
                    "lng": 2.0833,
                },
                {
                    "time": "18:45",
                    "activity": "Return flight: Barcelona BCN → Paris CDG",
                    "location": "Barcelona Airport, Terminal 1",
                    "cost": 0,
                    "notes": "Vueling VY8362. Arrives Paris CDG 20:55. Have passports and boarding passes ready.",
                    "lat": 41.2974,
                    "lng": 2.0833,
                },
            ],
        },
    ],
    "budgetBreakdown": {
        "flights": 196,
        "accommodation": 280,
        "carRental": 0,
        "food": 131,
        "activities": 186,
        "misc": 50,
    },
}

# ── Task → mock data map ─────────────────────────────────────────────────────
_MOCK: dict = {
    "destinations": _DESTINATIONS,
    "flights":      _FLIGHTS,
    "hotels":       _HOTELS,
    "carrental":    _CAR_RENTALS,
    "attractions":  _ATTRACTIONS,
    "itinerary":    _ITINERARY,
}

# Status events emitted before the result, keyed by task
_STATUS_EVENTS: dict = {
    "destinations": [
        ("🔍", "Searching popular destinations…"),
        ("📊", "Scoring destinations against your profile…"),
    ],
    "flights": [
        ("✈️", "Searching round-trip flights…"),
        ("💺", "Comparing fares and schedules…"),
    ],
    "hotels": [
        ("🏨", "Searching accommodations…"),
        ("⭐", "Filtering by rating and amenities…"),
    ],
    "carrental": [
        ("🚗", "Checking car rental availability…"),
        ("🔑", "Comparing vehicles and pickup options…"),
    ],
    "attractions": [
        ("🗺️", "Discovering top attractions…"),
        ("🎟️", "Fetching ticket prices and tips…"),
    ],
    "itinerary": [
        ("📅", "Planning your day-by-day itinerary…"),
        ("🗓️", "Optimising route and timing…"),
        ("✅", "Finalising your perfect trip plan…"),
    ],
}


async def stream_debug(
    system_prompt: str, user_message: str, task: str
) -> AsyncGenerator[dict, None]:
    """
    Yield SSE-style event dicts for the debug/mock backend.
    Emits realistic status events then immediately resolves with canned data.
    """
    # Announce the call
    yield {
        "event": "chat.agent_call",
        "payload": {
            "agent_call": {
                "name": "debug_service",
                "arguments": f"mock:{task}",
            }
        },
    }

    # Emit per-task status ticks (short delays so the UI feels alive)
    for icon, text in _STATUS_EVENTS.get(task, [("🔧", "Generating mock data…")]):
        await asyncio.sleep(0.25)
        yield {
            "event": "chat.delta",
            "payload": {"content": text},
        }
        yield {
            "event": "agent.status",
            "payload": {"icon": icon, "text": text},
        }

    # Small pause to feel like real processing
    await asyncio.sleep(0.2)

    mock = _MOCK.get(task)
    if mock is None:
        yield {
            "_type": "error",
            "message": f"Debug service: no mock data for task '{task}'",
        }
        return

    data = json.dumps(mock, ensure_ascii=False)

    yield {"event": "chat.final", "payload": {"content": ""}}
    yield {"_type": "done", "data": data}
