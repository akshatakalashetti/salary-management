# Requirements — Salary Management System

## Goal
ACME's HR team currently manages salary data for 10,000 employees across multiple
countries in spreadsheets. We are replacing that workflow with a web application
that lets a single HR Manager persona view, manage, and analyze employee salary
data — including answering questions about how the organization pays its people
(by department, by country, and whether pay is equitable within comparable roles).

## Scope & Features (in)
1. **Employee records & salary history (CRUD)** — create/view/update employees,
   and record salary changes (hires, raises, corrections) as an append-only,
   effective-dated history rather than overwriting a single "salary" field. This
   is the core data model: it lets the org answer "what is this person paid
   today" *and* "how has their pay changed over time" from the same data.
2. **Search, filter, and pagination across 10,000 employees** — a spreadsheet
   with 10,000 rows is exactly the pain point we're removing, so the employee
   list must support search (name/email/employee code), filtering (department,
   country, gender, level, status), sorting, and server-side pagination so the
   UI stays fast regardless of headcount.
3. **Pay analytics** — average/median current salary by department and by
   country, and salary bands (min/median/p25/p75/max) by level, computed live
   from current data. This directly answers "how does the org pay people."
4. **Pay equity / outlier detection** — flag individual employees whose current
   salary deviates significantly from the median of their peer cohort (same
   department + level), and flag cohorts with a significant gender pay gap.
   Method is a simple, explainable cohort-median-deviation calculation (not a
   black-box model) so an HR manager can understand exactly why something was
   flagged.

## Deliberately Out of Scope (and why)
- **Authentication / multi-user accounts** — the brief specifies a single HR
  Manager persona. Adding login, roles, and permissions is a real requirement
  in production HR software, but it doesn't change how salary data is modeled
  or analyzed, and building it would trade time away from the core problem.
- **Live currency conversion / FX rates** — employees are paid in their
  country's local currency, which is stored and displayed as-is. Converting
  everything to a single reporting currency requires an FX rate source and a
  policy for handling rate changes over time; it's a real feature for a global
  payroll product but orthogonal to demonstrating the core data model and
  analytics here.
- **Payroll processing / tax / statutory compliance** — this is a *salary
  management and reporting* tool, not a payroll run engine. Computing net pay,
  tax withholding, or statutory filings per country is a large, country-specific
  domain on its own.
- **Database migrations tooling (e.g. Alembic)** — the schema is finalized
  before the seed script runs and there's a single deploy target for this
  assessment; `create_all()` on startup is simpler to run and explain. A real
  production system evolving over time would need proper migrations.
- **Internationalization / mobile app** — a single-locale (English) responsive
  web UI is sufficient to demonstrate the product; localization and native
  mobile clients are separate, larger efforts not central to this assessment.
- **Cloud hosting / CI-CD pipeline** — the software runs fully via Docker
  Compose locally (documented in the README) plus a recorded demo video, rather
  than being deployed to a public cloud host, to keep the submission
  self-contained and avoid unrelated infrastructure/account setup.

## Non-Functional Notes
- Data: SQLite is sufficient at 10,000 employees (see `docs/PERFORMANCE.md` for
  why analytics are computed at query time rather than precomputed).
- The seed script generates realistic, synthetic salary variance *and*
  deliberately injects some pay outliers and a gender pay gap in a subset of
  cohorts, so the analytics/equity features have real signal to demonstrate.
  This is clearly a synthetic dataset, not a claim about any real organization.
