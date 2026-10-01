.PHONY: help start stop restart seed build logs clean test lint format dev-backend dev-frontend install

# Default target
help:
	@echo ""
	@echo "  ACME Salary Management — Available Commands"
	@echo "  ─────────────────────────────────────────────"
	@echo "  make start          Start backend + frontend (Docker)"
	@echo "  make stop           Stop all containers"
	@echo "  make restart        Restart all containers"
	@echo "  make seed           Seed 10,000 employees into the database"
	@echo "  make build          Rebuild Docker images"
	@echo "  make logs           Show live container logs"
	@echo "  make clean          Stop containers and remove volumes"
	@echo ""
	@echo "  make test           Run backend test suite"
	@echo "  make lint           Run ruff linter"
	@echo "  make format         Run ruff formatter"
	@echo ""
	@echo "  make dev-backend    Run backend locally (no Docker)"
	@echo "  make dev-frontend   Run frontend locally (no Docker)"
	@echo "  make install        Install backend dependencies"
	@echo ""

# ── Docker ────────────────────────────────────────────────────────────────────

start:
	docker compose up -d backend frontend
	@echo "✅  App running at http://localhost:5173"
	@echo "    API docs at  http://localhost:8000/docs"

stop:
	docker compose down

restart:
	docker compose restart backend frontend

seed:
	docker compose run --rm seed
	@echo "✅  Database seeded"
	@echo "    HR:       hr@acme-corp.example / hr-password"
	@echo "    Employee: employee@acme-corp.example / Employee@123"

build:
	docker compose build

logs:
	docker compose logs -f backend frontend

clean:
	docker compose down -v
	@echo "✅  Containers stopped and volumes removed"

# ── Testing & Quality ──────────────────────────────────────────────────────────

test:
	cd backend && source .venv/bin/activate && pytest -q

lint:
	cd backend && source .venv/bin/activate && ruff check .
	cd frontend && npm run lint

format:
	cd backend && source .venv/bin/activate && ruff format .

# ── Local Dev (without Docker) ─────────────────────────────────────────────────

install:
	cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install
	@echo "✅  Dependencies installed"

dev-backend:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev
