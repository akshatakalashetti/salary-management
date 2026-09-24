from pydantic import BaseModel


class CohortStatsOut(BaseModel):
    key: str
    count: int
    avg: float
    median: float
    min: float
    max: float
    p25: float
    p75: float


class SummaryOut(BaseModel):
    headcount: int
    # None when no country_id filter is applied: salaries are stored in local
    # currency with no FX conversion (see docs/requirements.md non-goals), so
    # an org-wide average/median would silently blend incompatible
    # currencies. Pass country_id to get a currency-consistent figure.
    avg_salary: float | None
    median_salary: float | None


class OutlierOut(BaseModel):
    employee_id: int
    employee_name: str
    cohort_key: str
    salary: float
    cohort_median: float
    deviation_pct: float
    direction: str


class GenderGapOut(BaseModel):
    cohort_key: str
    gap_pct: float
    higher_gender: str
    lower_gender: str
    avg_by_gender: dict[str, float]
    count_by_gender: dict[str, int]
