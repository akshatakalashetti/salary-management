# AI Usage Log

This project was built with Claude Code (Anthropic) as the primary
implementation tool. This log describes how it was used, not just that it
was used — the assessment specifically asks for judgment about *how*, not
just adoption.

## 1. Scoping and clarification (before any code)

Before writing anything, I was asked to make explicit decisions rather than
have them assumed:

- Backend stack (FastAPI + SQLite vs. Django vs. Flask)
- Frontend stack (React/Vite vs. Next.js)
- What "fully functional deployed software" means for a take-home (chose
  Docker Compose + demo video over a public cloud deploy, to avoid needing a
  cloud account/CI setup for something meant to be reviewed locally)
- Feature scope for "answer questions about how the org pays people" (chose
  all four: CRUD, search/pagination, pay analytics, pay equity/outliers)

This matches the brief's own instruction to ask rather than assume.

## 2. Architecture design (plan mode)

A dedicated planning pass worked out, before implementation: the data model
(effective-dated `salary_history`, no redundant "current salary" column),
the API surface, the pay-equity method (cohort-median-deviation, chosen
explicitly over a black-box model for explainability), the seed script's
approach to bulk inserts and synthetic signal injection, the frontend's
server-side-pagination requirement, the testing strategy, and a realistic
commit sequence. This became `docs/requirements.md` and the structure
reflected in `docs/ARCHITECTURE.md`.

## 3. Implementation, verified at each step — not just generated

Every layer was built and then actually run before moving on, not assumed
correct from the code alone:

- After writing the SQLAlchemy models, `Base.metadata.create_all()` was run
  and the resulting table list checked against expectations.
- After writing the employee CRUD/salary-history endpoints, an ad hoc script
  exercised create → add-raise → detail → search against a live `TestClient`
  before any pytest was written, to catch integration issues early.
- The pytest suite (34 tests by the time analytics/equity were added) was
  run after every feature commit, not just once at the end.

**A real bug this caught:** sorting the employee list by `current_salary`
built a *second*, disconnected SQL subquery instead of reusing the one
already joined into the list query, producing `no such column` at the
database level. The test suite caught it immediately; the fix was to build
the subquery once and reuse it for both the join and the `ORDER BY`.

**A more significant bug this caught:** after seeding the full 10,000-row
dataset and manually inspecting the analytics output (not just checking that
the endpoint returned 200), the org-wide "average salary" was ~738,000 — an
implausible number that turned out to be USD and INR salaries averaged
together with no currency conversion. The same issue affected the pay-equity
cohort key, flagging 62% of employees as "outliers" simply because of which
country they were in. This was caught by *looking at whether the output made
product sense*, not by a type checker or a passing test — the tests at that
point were passing because they only used single-country fixtures. The fix
(country as a required dimension for currency-sensitive aggregates) is
documented in `docs/TRADEOFFS.md`, and new tests were added that would have
caught the original bug (`test_by_department_groups_correctly_within_a_country`
mixes a third country into the fixture specifically to guard against
regressing this).

**A verification gap this session caught in itself:** every earlier "type
check" during this build ran `npx tsc --noEmit` from the frontend root and
reported success — but the root `tsconfig.json` is a "solution" config
(`"files": []`, only `references` to `tsconfig.app.json`/`tsconfig.node.json`).
Run that way, `tsc` checks zero files and trivially "passes." This was only
discovered when `npm run build` (which correctly runs `tsc -b`, following the
project references) was actually executed and failed with real errors: MUI
v9 had removed the `fontWeight` shorthand prop from `Typography` (a breaking
change from earlier MUI versions this app's code was implicitly written
against), so every `<Typography fontWeight={600}>` in the app was invalid.
The fix was mechanical (move `fontWeight` into `sx`), but the more important
fix was to the verification process itself: CI now runs `tsc -b` (added
specifically because the ad hoc command used all session was silently
checking nothing) and a real `npm run build`, not just a spot-checked
`tsc --noEmit`. Recorded here because it's a good example of the general
risk with AI-assisted verification: a green check that *looks* like the real
one but silently isn't needs to actually be run end-to-end (here, an
untouched production build), not trusted because a superficially-similar
command returned success previously.

## 4. Where AI output was corrected or overridden

- The initial `on_event("startup")` handler was flagged as deprecated by
  FastAPI's own warning output during test runs; replaced with a `lifespan`
  context manager.
- A first draft of the seed script assumed bulk-inserted employee rows would
  receive sequential auto-increment IDs matching insertion order, and used
  that to link `salary_history` rows to employees. This was an unverified
  assumption about SQLite's rowid behavior under `executemany`, so it was
  replaced with resolving `employee_id` via the unique `employee_code` after
  the insert — slightly more code, no fragile assumption.
- Chart library choice (`@mui/x-charts`) was kept inside the MUI ecosystem
  rather than adding a second charting dependency (e.g. Recharts), a
  deliberate call to minimize dependency surface for a small app.

## 5. What was *not* delegated to AI without review

Every architectural decision recorded in `docs/TRADEOFFS.md` was reviewed
against the specific numbers produced by the seeded dataset (e.g., actually
checking the outlier count before and after the cohort-key fix — 6,211 vs.
1,098 — rather than trusting that the code "looked right"). The requirements
document's non-goals were chosen deliberately to match the assessment's
explicit scope, not generated generically.
