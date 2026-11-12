from datetime import date, timedelta
from typing import Any

import httpx

from app.config import Settings
from app.schemas import FlightOption


async def find_flights(
    settings: Settings,
    origin: str,
    destination: str,
    departure_date: date,
) -> tuple[list[FlightOption], str | None]:
    if not settings.aviationstack_access_key:
        return [], "AviationStack is not configured. Add AVIATIONSTACK_ACCESS_KEY to enable flight data."

    base_url = settings.aviationstack_base_url.rstrip("/")
    is_future = departure_date > date.today()
    if is_future:
        if departure_date > date.today() + timedelta(days=365):
            return [], "AviationStack future schedules are limited to the next 12 months."
        url = f"{base_url}/flightsFuture"
        params = {
            "access_key": settings.aviationstack_access_key,
            "iataCode": origin,
            "type": "departure",
            "date": departure_date.isoformat(),
        }
    else:
        url = f"{base_url}/flights"
        params = {
            "access_key": settings.aviationstack_access_key,
            "dep_iata": origin,
            "arr_iata": destination,
            "flight_date": departure_date.isoformat(),
        }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload: dict[str, Any] = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        return [], f"Flight data could not be retrieved ({type(exc).__name__})."

    if payload.get("error"):
        return [], "AviationStack returned an API error. Check the API plan, key, and requested date."

    options: list[FlightOption] = []
    for item in payload.get("data", []):
        airline = item.get("airline") or {}
        flight = item.get("flight") or {}
        departure = item.get("departure") or {}
        arrival = item.get("arrival") or {}
        if is_future and (arrival.get("iataCode") or "").upper() != destination:
            continue
        options.append(
            FlightOption(
                airline=airline.get("name") or "Airline not listed",
                flight_number=(
                    flight.get("iataNumber")
                    or flight.get("iata")
                    or flight.get("number")
                    or "Flight number not listed"
                ),
                status="Scheduled" if is_future else item.get("flight_status"),
                departure_airport=departure.get("airport") or departure.get("iataCode") or origin,
                arrival_airport=arrival.get("airport") or arrival.get("iataCode") or destination,
                departure_time=departure.get("scheduled") or departure.get("scheduledTime") or departure.get("estimated"),
                arrival_time=arrival.get("scheduled") or arrival.get("scheduledTime") or arrival.get("estimated"),
            )
        )
        if len(options) == 8:
            break

    return options, None
