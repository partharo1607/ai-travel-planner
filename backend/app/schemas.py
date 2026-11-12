from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class TripRequest(BaseModel):
    origin: str = Field(min_length=3, max_length=3, description="Origin airport IATA code")
    destination: str = Field(min_length=3, max_length=3, description="Destination airport IATA code")
    destination_name: str = Field(default="", max_length=120)
    departure_date: date
    return_date: date
    travelers: int = Field(default=1, ge=1, le=12)
    budget_level: Literal["budget", "balanced", "premium"] = "balanced"
    interests: list[str] = Field(default_factory=list, max_length=8)
    notes: str = Field(default="", max_length=1200)
    conversation_id: UUID | None = None

    @field_validator("origin", "destination")
    @classmethod
    def normalize_airport_code(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if not cleaned.isalpha() or len(cleaned) != 3:
            raise ValueError("Enter a three-letter IATA airport code, such as DEL or SFO.")
        return cleaned

    @model_validator(mode="after")
    def validate_trip(self) -> "TripRequest":
        if self.origin == self.destination:
            raise ValueError("Origin and destination must be different airports.")
        if self.return_date < self.departure_date:
            raise ValueError("Return date must be on or after departure date.")
        return self


class FlightOption(BaseModel):
    airline: str = "Airline not listed"
    flight_number: str = "Flight number not listed"
    status: str | None = None
    departure_airport: str | None = None
    arrival_airport: str | None = None
    departure_time: str | None = None
    arrival_time: str | None = None


class HotelResult(BaseModel):
    title: str
    url: str
    snippet: str


class TripPlanResponse(BaseModel):
    conversation_id: UUID
    flights: list[FlightOption]
    hotels: list[HotelResult]
    flight_summary: str
    hotel_summary: str
    itinerary: str
    final_response: str
    agents: list[str]
