from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics.aggregation import group_by, org_summary
from app.crud.analytics import fetch_current_salary_points
from app.db.base import get_db
from app.schemas.analytics import CohortStatsOut, SummaryOut

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _to_cohort_out(stats) -> CohortStatsOut:
    return CohortStatsOut(**stats.__dict__)


@router.get("/summary", response_model=SummaryOut)
def summary(country_id: int | None = None, db: Session = Depends(get_db)):
    points = fetch_current_salary_points(db, country_id=country_id)
    stats = org_summary(points)
    if stats is None:
        return SummaryOut(headcount=0, avg_salary=None, median_salary=None)
    # Without a country filter, headcount is still meaningful (currency-
    # independent) but avg/median would blend currencies, so they're
    # withheld rather than reported as a misleading blended number.
    if country_id is None:
        return SummaryOut(headcount=stats.count, avg_salary=None, median_salary=None)
    return SummaryOut(headcount=stats.count, avg_salary=stats.avg, median_salary=stats.median)


@router.get("/by-department", response_model=list[CohortStatsOut])
def by_department(
    country_id: int = Query(
        ..., description="Required: avg/median would blend currencies across countries otherwise"
    ),
    db: Session = Depends(get_db),
):
    points = fetch_current_salary_points(db, country_id=country_id)
    grouped = group_by(points, key_fn=lambda p: p.department)
    return [_to_cohort_out(s) for s in sorted(grouped.values(), key=lambda s: s.key)]


@router.get("/by-country", response_model=list[CohortStatsOut])
def by_country(department_id: int | None = None, db: Session = Depends(get_db)):
    # No country_id filter needed here: grouping BY country means every
    # bucket is single-currency by construction, so this is the one
    # cross-country comparison that's safe without a currency conversion.
    points = fetch_current_salary_points(db, department_id=department_id)
    grouped = group_by(points, key_fn=lambda p: p.country)
    return [_to_cohort_out(s) for s in sorted(grouped.values(), key=lambda s: s.key)]


@router.get("/salary-bands", response_model=list[CohortStatsOut])
def salary_bands(
    country_id: int = Query(
        ..., description="Required: avg/median would blend currencies across countries otherwise"
    ),
    db: Session = Depends(get_db),
):
    points = fetch_current_salary_points(db, country_id=country_id)
    grouped = group_by(points, key_fn=lambda p: p.level)
    return [_to_cohort_out(s) for s in sorted(grouped.values(), key=lambda s: s.key)]
