from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI Travel Planner"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/travel_planner"
    openai_api_key: str | None = None
    openai_model: str = "gpt-6-luna"
    aviationstack_access_key: str | None = None
    aviationstack_base_url: str = "https://api.aviationstack.com/v1"
    tavily_api_key: str | None = None
    allowed_origins: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
