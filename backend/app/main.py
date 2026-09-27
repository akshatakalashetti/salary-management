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
    """Seed demo data on first startup. Also re-creates user accounts if
    employees exist but users don't (handles the case where a previous
    deploy seeded employees but user creation timed out)."""
    from sqlalchemy import text
    from app.db.base import SessionLocal
    import logging
    log = logging.getLogger("uvicorn")
    try:
        db = SessionLocal()
        emp_count = db.execute(text("SELECT count(*) FROM employees")).scalar()
        user_count = db.execute(text("SELECT count(*) FROM users")).scalar()
        db.close()

        if emp_count == 0:
            log.info("Empty database — running full seed…")
            from app.scripts.seed import run
            run(10_000)
        elif user_count == 0:
            log.info("Employees exist but no users — creating user accounts…")
            from app.scripts.seed import _hash_seed
            from app.db.base import SessionLocal
            from app.models.user import User
            from app.models.employee import Employee
            from sqlalchemy import insert
            session = SessionLocal()
            try:
                session.add(User(
                    email="hr@acme-corp.example",
                    password_hash=_hash_seed("hr-password"),
                    role="hr",
                    employee_id=None,
                ))
                session.commit()
                shared_hash = _hash_seed("Employee@123")
                all_emps = session.query(Employee.id, Employee.email).all()
                rows = [{"email": e.email, "password_hash": shared_hash, "role": "employee", "employee_id": e.id} for e in all_emps]
                for start in range(0, len(rows), 500):
                    session.execute(insert(User), rows[start:start+500])
                session.commit()
                log.info(f"Created {len(rows)+1} user accounts.")
            finally:
                session.close()
    except Exception as exc:
        import logging
        logging.getLogger("uvicorn").warning(f"Auto-seed skipped: {exc}")


app = FastAPI(title="Salary Management API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
