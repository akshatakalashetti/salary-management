"""Pure aggregation functions over plain (no ORM/session) salary data.

Kept as pure functions operating on simple tuples/dataclasses so they're
unit-testable without a database, and so business logic (what "median"
or "salary band" means) lives in exactly one place instead of being
duplicated across SQL strings.
"""

import statistics
from collections import defaultdict
from dataclasses import dataclass


@dataclass(frozen=True)
class SalaryPoint:
    employee_id: int
    department: str
    country: str
    level: str
    gender: str
    salary: float


@dataclass(frozen=True)
class CohortStats:
    key: str
    count: int
    avg: float
    median: float
    min: float
    max: float
    p25: float
    p75: float


def _percentile(sorted_values: list[float], pct: float) -> float:
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]
    k = (len(sorted_values) - 1) * pct
    f = int(k)
    c = min(f + 1, len(sorted_values) - 1)
    if f == c:
        return sorted_values[f]
    return sorted_values[f] + (sorted_values[c] - sorted_values[f]) * (k - f)


def summarize(salaries: list[float]) -> CohortStats | None:
    if not salaries:
        return None
    ordered = sorted(salaries)
    return CohortStats(
        key="",
        count=len(ordered),
        avg=round(statistics.fmean(ordered), 2),
        median=round(statistics.median(ordered), 2),
        min=round(ordered[0], 2),
        max=round(ordered[-1], 2),
        p25=round(_percentile(ordered, 0.25), 2),
        p75=round(_percentile(ordered, 0.75), 2),
    )


def group_by(points: list[SalaryPoint], key_fn) -> dict[str, CohortStats]:
    buckets: dict[str, list[float]] = defaultdict(list)
    for p in points:
        buckets[key_fn(p)].append(p.salary)

    result = {}
    for key, salaries in buckets.items():
        stats = summarize(salaries)
        if stats is not None:
            result[key] = CohortStats(key=key, **{k: v for k, v in stats.__dict__.items() if k != "key"})
    return result


def org_summary(points: list[SalaryPoint]) -> CohortStats | None:
    return summarize([p.salary for p in points])
