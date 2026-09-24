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
    avg_salary: float
    median_salary: float


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
