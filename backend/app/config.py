from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    database_url: str = "postgresql+asyncpg://transitops:transitops@localhost:5432/transitops"
    secret_key: str = "dev-secret"
    algorithm: str = "HS256"
    access_token_expire_hours: int = 24
    cors_origins: str = "http://localhost:5173"

    # Load environment variables from the .env file
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        """Return the configured CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
