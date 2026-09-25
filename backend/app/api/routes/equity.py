from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.analytics.equity import find_gender_gaps, find_outliers
from app.core.auth import require_hr
from app.core.config import settings
from app.crud.analytics import fetch_current_salary_points
from app.db.base import get_db
from app.models.employee import Employee
from app.schemas.analytics import GenderGapOut, OutlierOut

router = APIRouter(prefix="/analytics/pay-equity", tags=["pay-equity"], dependencies=[Depends(require_hr)])


@router.get("/outliers", response_model=list[OutlierOut])
def outliers(
    threshold: float = Query(default=settings.equity_outlier_threshold, gt=0),
    min_cohort_size: int = Query(default=settings.equity_min_cohort_size, ge=1),
    db: Session = Depends(get_db),
):
    points = fetch_current_salary_points(db)
    results = find_outliers(points, min_cohort_size=min_cohort_size, threshold=threshold)

    names = dict(
        db.execute(
            select(Employee.id, Employee.first_name + " " + Employee.last_name).where(
                Employee.id.in_([r.employee_id for r in results])
            )
        ).all()
    )
    return [
        OutlierOut(
            employee_id=r.employee_id,
            employee_name=names.get(r.employee_id, ""),
            cohort_key=r.cohort_key,
            salary=r.salary,
            cohort_median=r.cohort_median,
            deviation_pct=r.deviation_pct,
            direction=r.direction,
        )
        for r in results
    ]


@router.get("/gender-gap", response_model=list[GenderGapOut])
def gender_gap(
    threshold: float = Query(default=settings.equity_gender_gap_threshold, gt=0),
    min_per_gender: int = Query(default=2, ge=1),
    db: Session = Depends(get_db),
):
    points = fetch_current_salary_points(db)
    results = find_gender_gaps(points, min_per_gender=min_per_gender, threshold=threshold)
    return [GenderGapOut(**r.__dict__) for r in results]
