import datetime as dt
from dataclasses import dataclass

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.crud.current_salary import current_salary_subquery
from app.models.employee import Employee
from app.models.salary_history import SalaryHistory
from app.schemas.employee import EmployeeCreate, EmployeeUpdate

SORTABLE_FIELDS = {
    "first_name": Employee.first_name,
    "last_name": Employee.last_name,
    "hire_date": Employee.hire_date,
    "current_salary": None,  # resolved specially, see list_employees
}


@dataclass
class EmployeeListRow:
    employee: Employee
    current_salary: object | None
    current_currency: str | None


def _base_list_query() -> Select:
    salary_sq = current_salary_subquery()
    return (
        select(Employee, salary_sq.c.current_salary, salary_sq.c.current_currency)
        .outerjoin(salary_sq, salary_sq.c.employee_id == Employee.id)
        .options(joinedload(Employee.department), joinedload(Employee.country))
    )


def list_employees(
    db: Session,
    *,
    search: str | None = None,
    department_id: int | None = None,
    country_id: int | None = None,
    gender: str | None = None,
    level: str | None = None,
    status: str | None = "active",
    sort_by: str = "last_name",
    sort_dir: str = "asc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[EmployeeListRow], int]:
    stmt = _base_list_query()
    count_stmt = select(func.count()).select_from(Employee)

    conditions = []
    if search:
        like = f"%{search}%"
        conditions.append(
            or_(
                Employee.first_name.ilike(like),
                Employee.last_name.ilike(like),
                Employee.email.ilike(like),
                Employee.employee_code.ilike(like),
            )
        )
    if department_id is not None:
        conditions.append(Employee.department_id == department_id)
    if country_id is not None:
        conditions.append(Employee.country_id == country_id)
    if gender is not None:
        conditions.append(Employee.gender == gender)
    if level is not None:
        conditions.append(Employee.level == level)
    if status is not None:
        conditions.append(Employee.status == status)

    for cond in conditions:
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    total = db.execute(count_stmt).scalar_one()

    salary_sq = current_salary_subquery()
    if sort_by == "current_salary":
        order_col = salary_sq.c.current_salary
    else:
        order_col = SORTABLE_FIELDS.get(sort_by, Employee.last_name)
    order_col = order_col.desc() if sort_dir == "desc" else order_col.asc()
    stmt = stmt.order_by(order_col).offset((page - 1) * page_size).limit(page_size)

    rows = db.execute(stmt).all()
    result = [EmployeeListRow(employee=r[0], current_salary=r[1], current_currency=r[2]) for r in rows]
    return result, total


def get_employee(db: Session, employee_id: int) -> Employee | None:
    stmt = (
        select(Employee)
        .where(Employee.id == employee_id)
        .options(joinedload(Employee.department), joinedload(Employee.country), joinedload(Employee.salary_history))
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def next_employee_code(db: Session) -> str:
    count = db.execute(select(func.count()).select_from(Employee)).scalar_one()
    return f"EMP-{count + 1:06d}"


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    employee = Employee(
        employee_code=next_employee_code(db),
        first_name=data.first_name,
        last_name=data.last_name,
        gender=data.gender,
        email=data.email,
        department_id=data.department_id,
        country_id=data.country_id,
        role_title=data.role_title,
        level=data.level,
        hire_date=data.hire_date,
        status="active",
    )
    db.add(employee)
    db.flush()  # assigns employee.id without ending the transaction

    salary_row = SalaryHistory(
        employee_id=employee.id,
        amount=data.starting_salary,
        currency=data.currency,
        effective_date=data.hire_date,
        reason="hire",
    )
    db.add(salary_row)
    db.commit()
    db.refresh(employee)
    return employee


def update_employee(db: Session, employee: Employee, data: EmployeeUpdate) -> Employee:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


def soft_delete_employee(db: Session, employee: Employee) -> Employee:
    employee.status = "terminated"
    db.commit()
    db.refresh(employee)
    return employee


def add_salary_history(db: Session, employee_id: int, data) -> SalaryHistory:
    row = SalaryHistory(
        employee_id=employee_id,
        amount=data.amount,
        currency=data.currency,
        effective_date=data.effective_date,
        reason=data.reason,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_salary_history(db: Session, employee_id: int, history_id: int) -> bool:
    remaining = db.execute(
        select(func.count()).select_from(SalaryHistory).where(SalaryHistory.employee_id == employee_id)
    ).scalar_one()
    if remaining <= 1:
        return False
    row = db.execute(
        select(SalaryHistory).where(SalaryHistory.id == history_id, SalaryHistory.employee_id == employee_id)
    ).scalar_one_or_none()
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True
