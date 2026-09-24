# ACME Salary Management System

Web application for an HR manager to manage salary data for ~10,000
employees across countries, and answer questions about how the org pays
people (department/country breakdowns, salary bands, pay-equity outliers).

Built for the Incubyte take-home assessment. See `docs/requirements.md` for
scope and non-goals, `docs/ARCHITECTURE.md` for the data model and API,
`docs/TRADEOFFS.md` for the reasoning behind key decisions, and
`docs/AI_USAGE.md` for how AI tooling was used during the build.

## Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React (Vite) + TypeScript + MUI + TanStack Query
- **Tests**: pytest (backend), 36 tests covering CRUD, search/pagination,
  salary-history derivation, analytics, and pay equity

## Running It

### Option A: Docker Compose (recommended)

```bash
docker compose up -d backend frontend
docker compose run --rm seed          # one-off: seeds 10,000 employees
```

- Frontend: http://localhost:5173
- Backend API docs (Swagger): http://localhost:8000/docs

The seed command is deliberately not run automatically on every startup —
running `docker compose up` again won't wipe data you've added manually
through the UI. Re-run `docker compose run --rm seed` any time you want to
reset to a fresh 10,000-employee dataset.

### Option B: Run locally without Docker

Backend:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.scripts.seed        # seeds 10,000 employees into ./data/salary.db
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Running backend tests

```bash
cd backend
source .venv/bin/activate
pytest
```

## Project Layout

```
salary-management/
├── docs/                  # requirements, architecture, trade-offs, performance, AI usage
├── docker-compose.yml
├── backend/               # FastAPI app, SQLAlchemy models, seed script, pytest suite
└── frontend/              # React + Vite + MUI app
```

## Demo Video

<!-- Add link to the recorded demo walkthrough here before submitting. -->
