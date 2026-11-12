from app.config import Settings
from app.schemas import HotelResult


async def find_hotels(
    settings: Settings,
    destination: str,
    check_in_date: str,
    check_out_date: str,
    budget_level: str,
) -> tuple[list[HotelResult], str | None]:
    if not settings.tavily_api_key:
        return [], "Tavily is not configured. Add TAVILY_API_KEY to enable hotel discovery."

    try:
        from tavily import AsyncTavilyClient

        client = AsyncTavilyClient(api_key=settings.tavily_api_key)
        query = (
            f"Hotels and highly rated places to stay in {destination} for "
            f"{check_in_date} to {check_out_date}, {budget_level} budget. "
            "Include official hotel pages when available."
        )
        response = await client.search(query=query, search_depth="basic", max_results=5)
    except Exception as exc:  # Provider SDK exceptions vary by release.
        return [], f"Hotel search could not be completed ({type(exc).__name__})."

    results = []
    for item in response.get("results", [])[:5]:
        url = item.get("url")
        title = item.get("title")
        if not url or not title:
            continue
        results.append(
            HotelResult(
                title=title,
                url=url,
                snippet=(item.get("content") or "").strip()[:500],
            )
        )
    return results, None
