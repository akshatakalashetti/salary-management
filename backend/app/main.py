from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 -- ensures models are registered before create_all
from app.api.routes import analytics, auth, employees, equity, leave, reference
from app.core.config import settings
from app.db.base import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    _auto_seed_if_empty()
    yield


def _auto_seed_if_empty() -> None:
    """Seed demo data on first startup (e.g. on Render/Railway where the
    filesystem is fresh after each deploy). Skips if employees already exist."""
    from sqlalchemy import text
    from app.db.base import SessionLocal
    try:
        db = SessionLocal()
        count = db.execute(text("SELECT count(*) FROM employees")).scalar()
        db.close()
        if count == 0:
            import logging
            logging.getLogger("uvicorn").info("Empty database detected — running seed script…")
            from app.scripts.seed import run
            run(10_000)
    except Exception as exc:
        import logging
        logging.getLogger("uvicorn").warning(f"Auto-seed skipped: {exc}")


app = FastAPI(title="Salary Management API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(reference.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(equity.router, prefix="/api/v1")
app.include_router(leave.router, prefix="/api/v1")
