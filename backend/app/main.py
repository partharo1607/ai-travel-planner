from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.config import settings
from app.graph import build_trip_graph, initial_state
from app.schemas import TripPlanResponse, TripRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncPostgresSaver.from_conn_string(settings.database_url) as checkpointer:
        await checkpointer.setup()
        app.state.trip_graph = build_trip_graph(settings, checkpointer)
        yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "travel-planner-api"}


@app.post("/api/trips/plan", response_model=TripPlanResponse)
async def plan_trip(request: TripRequest) -> TripPlanResponse:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="Add OPENAI_API_KEY to the project .env file to generate a trip plan.",
        )

    conversation_id = request.conversation_id or uuid4()
    graph = app.state.trip_graph
    try:
        result = await graph.ainvoke(
            initial_state(request, conversation_id),
            config={"configurable": {"thread_id": str(conversation_id)}},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"The trip planning workflow failed ({type(exc).__name__}). Check provider configuration and try again.",
        ) from exc

    return TripPlanResponse(
        conversation_id=conversation_id,
        flights=result.get("flights", []),
        hotels=result.get("hotels", []),
        flight_summary=result.get("flight_summary", ""),
        hotel_summary=result.get("hotel_summary", ""),
        itinerary=result.get("itinerary", ""),
        final_response=result.get("final_response", ""),
        agents=["Flight Agent", "Hotel Agent", "Itinerary Agent", "Final Response Agent"],
    )


STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="frontend")
