import json


def build_context_text(data: dict) -> str:
    """Build human-readable context string from collected travel data."""
    profile = data.get("travelerProfile", {})
    budget = data.get("budget", {})
    prefs = data.get("preferences", {})
    dest = data.get("selectedDestination")
    flight = data.get("selectedFlight")
    hotel = data.get("selectedHotel")
    car = data.get("selectedCar")

    lines = []

    if profile:
        line = f"Traveler Profile: {profile.get('adults', 1)} adults"
        children = profile.get("children", 0)
        if children:
            line += f", {children} children (ages: {profile.get('childAges', 'N/A')})"
        special = profile.get("specialNeeds", "none")
        line += f". Special needs: {special or 'none'}. Departing from: {profile.get('origin', '')}."
        lines.append(line)

    if budget:
        line = (
            f"Budget: {budget.get('total', 0)} {budget.get('currency', 'USD')} total. "
            f"Dates: {budget.get('dateFrom', '')} to {budget.get('dateTo', '')}. "
            f"Flexibility: {budget.get('flexibility', 'exact')}."
        )
        lines.append(line)

    if prefs:
        interests = ", ".join(prefs.get("interests", []))
        line = (
            f"Preferences: Interests: {interests}. "
            f"Style: {prefs.get('style', '')}. "
            f"Priority: {prefs.get('priority', '')}."
        )
        lines.append(line)

    if dest:
        lines.append(f"Selected Destination: {dest.get('name', '')}, {dest.get('country', '')}.")

    if flight:
        lines.append(f"Selected Flight: {json.dumps(flight)}")

    if hotel:
        lines.append(f"Selected Hotel: {json.dumps(hotel)}")

    if car:
        lines.append(f"Selected Car: {json.dumps(car)}")

    return "\n".join(lines)
