"""Single source of truth for deriving "current salary" from the append-only
salary_history table: the row with the greatest effective_date <= today for
each employee. Used by the employee list, employee detail, and every
analytics/equity query so this logic never gets duplicated or drifts.
"""

import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql.selectable import Subquery

from app.models.salary_history import SalaryHistory


def current_salary_subquery(as_of: dt.date | None = None) -> Subquery:
    as_of = as_of or dt.date.today()

    ranked = (
        select(
            SalaryHistory.employee_id,
            SalaryHistory.amount,
            SalaryHistory.currency,
            SalaryHistory.effective_date,
            func.row_number()
            .over(
                partition_by=SalaryHistory.employee_id,
                order_by=SalaryHistory.effective_date.desc(),
            )
            .label("rn"),
        )
        .where(SalaryHistory.effective_date <= as_of)
        .subquery()
    )
    return (
        select(
            ranked.c.employee_id,
            ranked.c.amount.label("current_salary"),
            ranked.c.currency.label("current_currency"),
            ranked.c.effective_date.label("current_salary_effective_date"),
        )
        .where(ranked.c.rn == 1)
        .subquery()
    )


def current_salary_for_employee(db: Session, employee_id: int, as_of: dt.date | None = None) -> SalaryHistory | None:
    as_of = as_of or dt.date.today()
    stmt = (
        select(SalaryHistory)
        .where(SalaryHistory.employee_id == employee_id, SalaryHistory.effective_date <= as_of)
        .order_by(SalaryHistory.effective_date.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()
