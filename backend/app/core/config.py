from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", extra="ignore")

    database_url: str = "sqlite:///./data/salary.db"
    cors_origins: list[str] = ["http://localhost:5173"]

    # Auth / JWT
    jwt_secret: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 hours — long enough for a full work day

    # Pay-equity thresholds. Named constants (not magic numbers) so they're
    # easy to explain/tune; overridable per-request via query params.
    equity_min_cohort_size: int = 3
    equity_outlier_threshold: float = 0.20
    equity_gender_gap_threshold: float = 0.10


settings = Settings()
