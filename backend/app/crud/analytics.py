from sqlalchemy import select
from sqlalchemy.orm import Session

from app.analytics.aggregation import SalaryPoint
from app.crud.current_salary import current_salary_subquery
from app.models.employee import Employee
from app.models.reference import Country, Department


def fetch_current_salary_points(
    db: Session,
    *,
    department_id: int | None = None,
    country_id: int | None = None,
) -> list[SalaryPoint]:
    """One query returning (department, country, level, gender, current_salary)
    for every active employee. Grouping/aggregation happens in Python
    (see app.analytics) rather than in SQL, since SQLite has no native
    median/percentile function and the result set (<= headcount rows) is
    trivially small to process in-process.
    """
    salary_sq = current_salary_subquery()
    stmt = (
        select(
            Employee.id,
            Department.name,
            Country.name,
            Employee.level,
            Employee.gender,
            salary_sq.c.current_salary,
        )
        .join(Department, Department.id == Employee.department_id)
        .join(Country, Country.id == Employee.country_id)
        .join(salary_sq, salary_sq.c.employee_id == Employee.id)
        .where(Employee.status == "active")
    )
    if department_id is not None:
        stmt = stmt.where(Employee.department_id == department_id)
    if country_id is not None:
        stmt = stmt.where(Employee.country_id == country_id)

    rows = db.execute(stmt).all()
    return [
        SalaryPoint(
            employee_id=row[0],
            department=row[1],
            country=row[2],
            level=row[3],
            gender=row[4],
            salary=float(row[5]),
        )
        for row in rows
    ]
