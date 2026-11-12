# Waypoint — AI Travel Planner

A full-stack travel planning app built around four specialized LangGraph agents. The Flight Agent retrieves AviationStack schedule data, the Hotel Agent searches web results with Tavily, the Itinerary Agent creates a day-by-day outline, and the Final Response Agent brings the plan together. The agents use OpenAI's Responses API, while a PostgreSQL-backed LangGraph checkpointer retains conversation state by trip thread.

The app provides planning information and links. It does not book or purchase flights or hotel stays.

**Live demo:** https://travel-planner-app-production.up.railway.app

## What it does

- Accepts an origin and destination airport code, dates, traveler count, budget style, interests, and optional notes.
- Searches current or historical flight information with AviationStack's `/flights` endpoint, and future schedules with `/flightsFuture`.
- Uses Tavily to discover lodging pages and preserves source links in the results.
- Runs the four-agent flow in LangGraph and saves thread state in PostgreSQL.
- Returns the flight and lodging findings, a day-by-day itinerary, and a consolidated trip brief.
- Includes a responsive React interface with a persistent conversation ID in the browser.

Future schedules are informational. Provider coverage depends on the AviationStack account plan; returned schedules do not include fares or guarantee availability. See [AviationStack's endpoint overview](https://aviationstack.com/faq) and [future flight schedule details](https://blog.apilayer.com/introducing-continuous-flight-schedules/).

## Stack

- **Frontend:** React, TypeScript, Vite, React Markdown
- **Backend:** Python, FastAPI, Pydantic
- **Agents and memory:** LangGraph, PostgreSQL checkpointer
- **Model:** OpenAI API (default model: `gpt-6-luna`)
- **External data:** AviationStack and Tavily

## Requirements

- Python 3.11+
- Node.js 18+
- Docker Desktop or a local PostgreSQL 16 database
- API keys for OpenAI and Tavily
- An AviationStack plan with access to the endpoint you intend to use

## Run locally

1. From this folder, create the environment file and add your provider keys:

   ```sh
   cp .env.example .env
   ```

   Fill `OPENAI_API_KEY`, `TAVILY_API_KEY`, and `AVIATIONSTACK_ACCESS_KEY`. `OPENAI_MODEL` can be changed if you want to use another model enabled for your API account. Keep `.env` private; it is ignored by Git.

2. Start PostgreSQL for local development:

   ```sh
   docker compose up -d postgres
   ```

3. Install and start the API:

   ```sh
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .
   uvicorn app.main:app --reload
   ```

   The API is at `http://localhost:8000`; interactive OpenAPI docs are at `http://localhost:8000/docs`.

4. In a second terminal, configure and start the web app:

   ```sh
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

## Production deployment

Build from the repository root with the included `Dockerfile`. The container builds the React frontend and serves it from the FastAPI application, so the site and API share one public origin. Set `DATABASE_URL` to a hosted PostgreSQL connection string and configure `OPENAI_API_KEY` and `OPENAI_MODEL` in the hosting provider's environment settings. `TAVILY_API_KEY` and `AVIATIONSTACK_ACCESS_KEY` enable lodging and flight searches. Keep all credentials in the host's secret settings; do not commit `.env` files.

## API

`POST /api/trips/plan` accepts JSON shaped like:

```json
{
  "origin": "SFO",
  "destination": "FCO",
  "destination_name": "Rome, Italy",
  "departure_date": "2026-12-10",
  "return_date": "2026-12-17",
  "travelers": 2,
  "budget_level": "balanced",
  "interests": ["Food", "Architecture"],
  "notes": "Prefer a relaxed pace"
}
```

Pass the response's `conversation_id` on a follow-up request to continue the same PostgreSQL-backed LangGraph thread.

## Provider references

- [LangGraph persistence and PostgreSQL checkpointer](https://langchain-ai.github.io/langgraph/reference/checkpoints/)
- [OpenAI Python SDK and Responses API](https://developers.openai.com/api/reference/python)
- [OpenAI API model catalog](https://developers.openai.com/api/docs/models)
- [Tavily Python SDK](https://github.com/tavily-ai/tavily-python)
- [AviationStack API documentation](https://aviationstack.com/documentation)
