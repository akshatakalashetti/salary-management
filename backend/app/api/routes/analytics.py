from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.analytics.aggregation import group_by, org_summary
from app.core.auth import require_hr
from app.crud.analytics import fetch_current_salary_points
from app.db.base import get_db
from app.models.employee import Employee
from app.models.reference import Department
from app.models.user import User
from app.schemas.analytics import CohortStatsOut, SummaryOut


class DeptHeadcount(BaseModel):
    department: str
    count: int

router = APIRouter(prefix="/analytics", tags=["analytics"], dependencies=[Depends(require_hr)])


def _to_cohort_out(stats) -> CohortStatsOut:
    return CohortStatsOut(**stats.__dict__)


@router.get("/summary", response_model=SummaryOut)
def summary(country_id: int | None = None, db: Session = Depends(get_db)):
    # Headcount is always the org-wide total, regardless of country_id --
    # it's currency-independent, so there's no reason to scope it down when
    # a country is selected just to compute avg/median. A previous version
    # of this endpoint filtered headcount by country_id too, which quietly
    # relabeled "headcount for the selected country" as "Total Headcount
    # (org-wide)" in the UI -- caught by actually looking at the rendered
    # page (519, matching Australia's headcount, not 10,000) rather than by
    # a test, since the existing tests only asserted the filtered-count
    # behavior was internally consistent, not that it matched the label.
    org_wide_headcount = len(fetch_current_salary_points(db))

    if country_id is None:
        return SummaryOut(headcount=org_wide_headcount, avg_salary=None, median_salary=None)

    stats = org_summary(fetch_current_salary_points(db, country_id=country_id))
    if stats is None:
        return SummaryOut(headcount=org_wide_headcount, avg_salary=None, median_salary=None)
    return SummaryOut(headcount=org_wide_headcount, avg_salary=stats.avg, median_salary=stats.median)


@router.get("/headcount-by-department", response_model=list[DeptHeadcount])
def headcount_by_department(db: Session = Depends(get_db)):
    """Org-wide headcount per department -- currency-independent, no filters needed."""
    rows = db.execute(
        select(Department.name, func.count(Employee.id))
        .join(Employee, Employee.department_id == Department.id)
        .where(Employee.status == "active")
        .group_by(Department.name)
        .order_by(func.count(Employee.id).desc())
    ).all()
    return [DeptHeadcount(department=row[0], count=row[1]) for row in rows]


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
