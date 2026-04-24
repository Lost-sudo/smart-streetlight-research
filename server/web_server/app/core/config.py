from typing import List
from pathlib import Path
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_SECRET_KEY: str
    REFRESH_ALGORITHM: str
    REFRESH_TOKEN_EXPIRE_MINUTES: int
    CORS_ORIGINS: List[str]
    COOKIE_SECURE: bool = True
    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_SAMESITE: str = "strict"
    ENABLE_ML: bool = True

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def DATABASE_URL(self) -> str:
        user = quote_plus(self.POSTGRES_USER)
        password = quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql+psycopg2://{user}:{password}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def REFRESH_COOKIE_MAX_AGE_SECONDS(self) -> int:
        return int(self.REFRESH_TOKEN_EXPIRE_MINUTES) * 60

settings = Settings()
