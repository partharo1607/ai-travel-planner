export type TripRequest = {
  origin: string;
  destination: string;
  destination_name: string;
  departure_date: string;
  return_date: string;
  travelers: number;
  budget_level: "budget" | "balanced" | "premium";
  interests: string[];
  notes: string;
  conversation_id?: string;
};

export type FlightOption = {
  airline: string;
  flight_number: string;
  status: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  departure_time: string | null;
  arrival_time: string | null;
};

export type HotelResult = {
  title: string;
  url: string;
  snippet: string;
};

export type TripPlan = {
  conversation_id: string;
  flights: FlightOption[];
  hotels: HotelResult[];
  flight_summary: string;
  hotel_summary: string;
  itinerary: string;
  final_response: string;
  agents: string[];
};
