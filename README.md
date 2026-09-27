<div align="center">

# 🏢 ACME Salary Management System

**A full-stack HR platform for managing salary data, payroll, leave, and pay equity across 10,000+ employees**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![Tests](https://img.shields.io/badge/Tests-40%20passing-brightgreen?style=flat&logo=pytest)](/)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=flat&logo=github-actions&logoColor=white)](/.github/workflows/ci.yml)

[Features](#features) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Demo](#demo-credentials)

</div>

---

## 🎯 Problem Statement

ACME's HR team managed salary data for **10,000 employees across 9 countries** using spreadsheets — tedious, error-prone, and impossible to analyze. This system replaces that with a modern web application where:

- **HR Managers** can manage all employee data, run payroll, view analytics, and detect pay inequity
- **Employees** can securely view their own profile, salary history, and apply for leave

---

## ✨ Features

### 👥 Employee Management
- Full CRUD with **effective-dated salary history** (append-only, audit-trail style)
- Extended profiles: address, payroll details, emergency contact
- Server-side search, filter, sort, and pagination across 10,000 employees
- **CSV export** of filtered results
- Soft delete (terminated employees preserved in history)

### 📊 Pay Analytics
- Headcount breakdown by department
- Avg / median / P25 / P75 salary by department, country, and level
- Country-scoped analytics (no mixing of currencies — a real correctness issue that was caught and fixed)

### ⚖️ Pay Equity Detection
- **Cohort-median-deviation** method (explainable, not a black box)
- Flags individuals paid >20% above/below their peer cohort
- Flags gender pay gaps >10% within cohorts
- Live threshold sliders — adjust and see results instantly

### 🏖️ Leave Management
- 4 leave types: **Earned** (21d), **Flexi** (5d), **Sick** (12d), **Casual** (7d)
- Balance tracking with progress bars
- Employees apply for leave with automatic balance validation

### 💳 Payroll Processing (UI)
- Month/year payroll run with animated batch processing
- Per-employee status: Pending → Processing → Paid ✓ + Email Sent
- Summary: total disbursed, notifications sent

### 🔐 Auth & Role-Based Access
- JWT authentication (HR and Employee roles)
- Backend RBAC: employees can only access their own record
- Frontend route guards

---

## 🏗️ Architecture

```
salary-management/
├── backend/          # FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── models/       # Employee, SalaryHistory, LeaveRequest, User
│   │   ├── api/routes/   # employees, analytics, equity, leave, auth, payroll
│   │   ├── analytics/    # Pure Python aggregation & equity functions
│   │   └── scripts/      # Seed script (10k employees, bulk insert, ~20s)
│   └── tests/        # 40 pytest tests, in-memory SQLite, <1s
└── frontend/         # React + Vite + MUI + TanStack Query
    └── src/
        ├── pages/    # EmployeeList, Detail, Analytics, Equity, Payroll, MyProfile
        ├── hooks/    # useEmployees, useAnalytics, useLeave, useAuth
        └── context/  # AuthContext (JWT + role)
```

**Key design decisions documented in [`docs/TRADEOFFS.md`](docs/TRADEOFFS.md):**

- **Effective-dated salary history** — current salary derived via `MAX(effective_date)`, never stored redundantly
- **Query-time analytics** — 10k rows is trivial for SQLite; precomputing would add staleness risk for zero benefit
- **Country-scoped analytics** — salary currencies are never mixed in the same aggregate
- **Cohort includes country** — prevents comparing USD and INR salaries as "outliers"

---

## 🚀 Quick Start

### Using Docker Compose (recommended)

```bash
git clone https://github.com/akshatakalashetti/salary-management.git
cd salary-management

# Start the stack
docker compose up -d backend frontend

# Seed 10,000 employees (~20 seconds)
docker compose run --rm seed

# Open the app
open http://localhost:5173
```

### Local development

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.scripts.seed    # seed demo data
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Run tests

```bash
cd backend && pytest -q   # 40 tests, ~1 second
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **HR Manager** | `hr@acme-corp.example` | `hr-password` |
| **Employee** | `gabriella.abbott.1073@acme-corp.example` | `EMP-001073` |

HR sees all 10,000 employees, analytics, equity, and payroll.  
Employee sees only their own profile, salary history, and leave.

---

## 📚 Documentation

| File | Contents |
|---|---|
| [`docs/requirements.md`](docs/requirements.md) | Goal, scope, non-goals (written before any code) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data model (ER diagram), API reference, frontend map |
| [`docs/TRADEOFFS.md`](docs/TRADEOFFS.md) | 12 documented decisions with reasoning |
| [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) | Why analytics are query-time, indexes used |
| [`docs/AI_USAGE.md`](docs/AI_USAGE.md) | Full log of AI tool usage + bugs caught |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.13, FastAPI 0.115, SQLAlchemy 2.0 |
| Database | SQLite (query-time analytics, no precomputation) |
| Auth | JWT (python-jose), bcrypt |
| Frontend | React 18, Vite, TypeScript 5.9, MUI v9 |
| State | TanStack Query (server state), React Context (auth) |
| Testing | pytest (40 tests), in-memory SQLite, httpx |
| CI | GitHub Actions (ruff + pytest + tsc -b + vite build) |
| Deploy | Docker Compose, Render (backend), Cloudflare Pages (frontend) |

---

<div align="center">
Built as a take-home assessment — demonstrating engineering judgment, AI-assisted development, and production-quality code.
</div>
