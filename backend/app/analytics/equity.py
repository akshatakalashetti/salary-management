"""Pay-equity / outlier detection.

Deliberately simple and explainable (cohort-median-deviation), not a
black-box model, so an HR manager can see exactly why something was
flagged: "this person's salary is 27% below the median of their
department+level cohort." See docs/TRADEOFFS.md for why this method
was chosen over e.g. a regression or ML-based approach.
"""

from collections import defaultdict
from dataclasses import dataclass
from statistics import median

from app.analytics.aggregation import SalaryPoint


@dataclass(frozen=True)
class OutlierResult:
    employee_id: int
    cohort_key: str
    salary: float
    cohort_median: float
    deviation_pct: float
    direction: str  # "over" | "under"


@dataclass(frozen=True)
class GenderGapResult:
    cohort_key: str
    gap_pct: float
    higher_gender: str
    lower_gender: str
    avg_by_gender: dict[str, float]
    count_by_gender: dict[str, int]


def _cohort_key(p: SalaryPoint) -> str:
    # Country is part of the cohort key -- not just an optional grouping --
    # because salaries are stored and compared in local currency with no FX
    # conversion (see docs/requirements.md non-goals). Without country in the
    # key, a cohort would silently mix e.g. INR and USD salaries and produce
    # meaningless "deviation from median" results.
    return f"{p.department} / {p.level} / {p.country}"


def find_outliers(
    points: list[SalaryPoint],
    *,
    min_cohort_size: int = 3,
    threshold: float = 0.20,
) -> list[OutlierResult]:
    by_cohort: dict[str, list[SalaryPoint]] = defaultdict(list)
    for p in points:
        by_cohort[_cohort_key(p)].append(p)

    results: list[OutlierResult] = []
    for key, members in by_cohort.items():
        if len(members) < min_cohort_size:
            continue
        cohort_median = median(m.salary for m in members)
        if cohort_median == 0:
            continue
        for m in members:
            deviation = (m.salary - cohort_median) / cohort_median
            if abs(deviation) > threshold:
                results.append(
                    OutlierResult(
                        employee_id=m.employee_id,
                        cohort_key=key,
                        salary=round(m.salary, 2),
                        cohort_median=round(cohort_median, 2),
                        deviation_pct=round(deviation, 4),
                        direction="over" if deviation > 0 else "under",
                    )
                )
    results.sort(key=lambda r: abs(r.deviation_pct), reverse=True)
    return results


def find_gender_gaps(
    points: list[SalaryPoint],
    *,
    min_per_gender: int = 2,
    threshold: float = 0.10,
) -> list[GenderGapResult]:
    by_cohort: dict[str, list[SalaryPoint]] = defaultdict(list)
    for p in points:
        by_cohort[_cohort_key(p)].append(p)

    results: list[GenderGapResult] = []
    for key, members in by_cohort.items():
        by_gender: dict[str, list[float]] = defaultdict(list)
        for m in members:
            by_gender[m.gender].append(m.salary)

        eligible = {g: salaries for g, salaries in by_gender.items() if len(salaries) >= min_per_gender}
        if len(eligible) < 2:
            continue

        avg_by_gender = {g: sum(s) / len(s) for g, s in eligible.items()}
        higher_gender = max(avg_by_gender, key=avg_by_gender.get)
        lower_gender = min(avg_by_gender, key=avg_by_gender.get)
        if higher_gender == lower_gender:
            continue

        higher, lower = avg_by_gender[higher_gender], avg_by_gender[lower_gender]
        gap_pct = (higher - lower) / higher if higher else 0.0
        if gap_pct > threshold:
            results.append(
                GenderGapResult(
                    cohort_key=key,
                    gap_pct=round(gap_pct, 4),
                    higher_gender=higher_gender,
                    lower_gender=lower_gender,
                    avg_by_gender={g: round(v, 2) for g, v in avg_by_gender.items()},
                    count_by_gender={g: len(s) for g, s in eligible.items()},
                )
            )
    results.sort(key=lambda r: r.gap_pct, reverse=True)
    return results
