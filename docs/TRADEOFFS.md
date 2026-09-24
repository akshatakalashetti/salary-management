# Trade-offs & Decisions

Listed roughly in the order they came up while building.

**SQLite, not Postgres.** Matches the assessment's suggestion and is genuinely
sufficient at 10,000 employees / ~15,000 salary_history rows — every query in
this app runs in single-digit milliseconds against that volume (see
`PERFORMANCE.md`). A real multi-writer production HR system would want
Postgres for concurrent-write safety, but that's not a constraint here.

**No Alembic / migrations tool.** The schema is finalized before the seed
script runs and there's one deploy target (local Docker Compose).
`Base.metadata.create_all()` on startup is simpler to run and explain. A
production system evolving over time would need real migrations — this is a
deliberate scope cut, not an oversight.

**Analytics computed at query time, not precomputed.** 10,000 rows is trivial
for SQLite to aggregate on every request. Precomputing (materialized summary
tables, refreshed on every salary write) would add real complexity — a
write-side trigger or background job, plus staleness risk if it's ever out of
sync — for zero measurable benefit at this scale. This would flip at
100,000+ rows or under heavy concurrent write load, where a cache or
materialized view would start to earn its complexity.

**Country is part of every currency-sensitive analytics/equity cohort key,
not an optional filter.** Salaries are stored in local currency with no FX
conversion (see requirements.md non-goals). Early in development,
`/analytics/by-department` and the pay-equity cohort key were
`(department, level)` only — grouping across all countries. Against the
seeded 10k dataset this produced a nonsensical org-wide "average salary" of
~738k (USD and INR magnitudes blended) and flagged 62% of employees as pay
"outliers" simply because their country's currency has larger raw numbers.
Fixed by making `country_id` a required parameter for `/analytics/by-department`
and `/analytics/salary-bands`, making `/analytics/summary`'s avg/median null
without a country filter, and adding country to the equity cohort key
`(department, level, country)`. `/analytics/by-country` needed no such fix —
grouping *by* country means every bucket is already single-currency.

**Cohort-median-deviation for pay equity, not a regression or ML model.** The
brief explicitly says "we are not looking for the most complex system." A
simple, explainable method — "this person is 27% below the median for their
department+level+country cohort" — is something an HR manager can verify and
trust immediately. A regression-based or ML approach could account for more
confounders but would trade transparency for marginal accuracy that this
dataset (and this assessment) doesn't call for.

**Minimum cohort size (3) and minimum-per-gender (2) guards.** Without them,
a cohort of 1-2 people would produce a "median" and "gap" that's really just
one or two individuals' data dressed up as a statistic — misleading, not
useful. Both thresholds, plus the outlier/gap deviation thresholds, are named
constants (`app/core/config.py`) and overridable per-request via query params
(exposed as sliders in the Equity page UI), not hardcoded magic numbers.

**Soft delete, not hard delete, for employees.** `DELETE /employees/{id}`
sets `status="terminated"` rather than removing the row. This preserves
salary history (an HR audit trail shouldn't disappear when someone leaves)
and matches how HR systems actually behave — people are terminated, not
erased.

**Salary history is append-only via the API — no `PUT`.** Corrections are
new rows with `reason="correction"`, and `DELETE` on a history row is only
allowed if it isn't an employee's last remaining record. This matches an
audit-trail data model: history isn't silently rewritten.

**No `end_date` column on salary_history.** Storing an end_date would mean
updating the "previous" row's end_date every time a new one is inserted —
extra writes, extra chances for the two dates to drift apart. Deriving
"current" from `MAX(effective_date) <= today` needs no such bookkeeping.

**react-query over Redux/Zustand.** The app's state is almost entirely
server state (paginated lists, filters, analytics) — react-query's caching,
request de-duplication, and `invalidateQueries` on mutation cover this in a
few lines per hook. The only *client* state (dialog open/closed, form
inputs) is local `useState`; there's nothing that justifies a global client
store.

**MUI DataGrid with `paginationMode`/`sortingMode="server"`.** The one
non-negotiable UI constraint at 10k rows: never fetch the whole dataset to
the browser. Only columns backed by a real backend `sort_by` value are
marked sortable, so a column header's sort arrow never silently no-ops.

**Docker Compose (local), not a cloud deploy.** Keeps the submission
self-contained — no cloud account, billing, or CI/CD setup required to
review it — while still satisfying "fully functional deployed software" via
one `docker compose up` plus a recorded demo video.

**Frontend dev server in Docker, not a production nginx build.** A
multi-stage build (`npm run build` + nginx) is the right call for a real
deployment, but adds Dockerfile complexity that isn't worth it for a
local-only demo. Noted here explicitly as a "know the shortcut" call, not an
unawareness of the production-correct approach.

**No frontend test suite.** All business logic (salary derivation,
analytics, equity math) lives server-side and is covered by the pytest
suite; the frontend is comparatively thin display/interaction code. Given
the time box, testing effort went where the logic actually is. TypeScript
strict mode catches a real class of UI bugs at compile time. This is a
scope decision made under time pressure, not an oversight — a follow-up pass
would add component tests for `EmployeeFilters`/`SalaryHistoryDialog` and a
couple of Playwright smoke flows (create employee → add raise → see it
reflected in the list).
