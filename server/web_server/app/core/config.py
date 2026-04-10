from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def REFRESH_COOKIE_MAX_AGE_SECONDS(self) -> int:
        return int(self.REFRESH_TOKEN_EXPIRE_MINUTES) * 60

settings = Settings()