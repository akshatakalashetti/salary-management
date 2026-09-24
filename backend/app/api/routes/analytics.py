from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.analytics.aggregation import group_by, org_summary
from app.crud.analytics import fetch_current_salary_points
from app.db.base import get_db
from app.schemas.analytics import CohortStatsOut, SummaryOut

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _to_cohort_out(stats) -> CohortStatsOut:
    return CohortStatsOut(**stats.__dict__)


@router.get("/summary", response_model=SummaryOut)
def summary(db: Session = Depends(get_db)):
    points = fetch_current_salary_points(db)
    stats = org_summary(points)
    if stats is None:
        return SummaryOut(headcount=0, avg_salary=0, median_salary=0)
    return SummaryOut(headcount=stats.count, avg_salary=stats.avg, median_salary=stats.median)


@router.get("/by-department", response_model=list[CohortStatsOut])
def by_department(country_id: int | None = None, db: Session = Depends(get_db)):
    points = fetch_current_salary_points(db, country_id=country_id)
    grouped = group_by(points, key_fn=lambda p: p.department)
    return [_to_cohort_out(s) for s in sorted(grouped.values(), key=lambda s: s.key)]


@router.get("/by-country", response_model=list[CohortStatsOut])
def by_country(department_id: int | None = None, db: Session = Depends(get_db)):
    points = fetch_current_salary_points(db, department_id=department_id)
    grouped = group_by(points, key_fn=lambda p: p.country)
    return [_to_cohort_out(s) for s in sorted(grouped.values(), key=lambda s: s.key)]


@router.get("/salary-bands", response_model=list[CohortStatsOut])
def salary_bands(db: Session = Depends(get_db)):
    points = fetch_current_salary_points(db)
    grouped = group_by(points, key_fn=lambda p: p.level)
    return [_to_cohort_out(s) for s in sorted(grouped.values(), key=lambda s: s.key)]
