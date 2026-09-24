# Performance Notes

## Indexes

- `salary_history(employee_id, effective_date)` — composite index supporting
  both the single-employee "current salary" lookup and the window-function
  query across all employees (list/analytics/equity all use the latter).
- `employees(department_id)`, `employees(country_id)`, `employees(gender)` —
  support the list endpoint's filters and the analytics/equity group-bys.

## Seed Script

10,000 employees + ~14,600 salary_history rows seed in **~2 seconds** on a
laptop, via SQLAlchemy Core bulk insert (`INSERT ... VALUES` with a list of
dicts) in two batches (employees, then salary_history), rather than 10,000+
individual `session.add()` + per-row `commit()` calls. The latter would take
noticeably longer due to per-statement transaction overhead multiplied by
tens of thousands of rows.

## Why Analytics Are Computed at Query Time

At 10,000 employees, every analytics/equity endpoint does one indexed join +
aggregation over at most 10,000 rows — this runs in single-digit
milliseconds on SQLite. Measured informally against the seeded dataset,
`/analytics/by-country`, `/analytics/pay-equity/outliers`, and
`/analytics/pay-equity/gender-gap` all return in well under 50ms including
Python-side grouping (SQLite has no native `MEDIAN()`/percentile function, so
grouping/median/percentile happen in Python via `statistics` over the query
result — the result set is small enough that this is not a bottleneck).

Precomputing (materialized aggregate tables refreshed via triggers or a
background job) would only pay for itself if either:

- **Headcount grew substantially** (100,000+ employees), where a full-table
  aggregation per request would start to show up in response times, or
- **Read volume were very high relative to write volume**, where caching the
  aggregate would meaningfully reduce database load.

Neither applies here, so precomputing would add real complexity (staleness
tracking, invalidation on every salary write) for no measurable benefit —
exactly the kind of premature optimization the assessment's "we are not
looking for the most complex system" guidance warns against.

## Frontend

The employee list never fetches more than one page (`page_size` ≤ 100) from
the API — `paginationMode="server"` and `sortingMode="server"` on the MUI
DataGrid mean sorting/filtering/pagination all happen in SQL against indexed
columns, not in the browser. This is the one hard constraint that scales
regardless of how large the `employees` table grows.
