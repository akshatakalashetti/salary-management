from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import employee as crud
from app.crud.current_salary import current_salary_for_employee
from app.db.base import get_db
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeDetail,
    EmployeeListItem,
    EmployeeListResponse,
    EmployeeUpdate,
)
from app.schemas.reference import CountryOut, DepartmentOut
from app.schemas.salary_history import SalaryHistoryCreate, SalaryHistoryOut

router = APIRouter(tags=["employees"])


def _to_list_item(row: crud.EmployeeListRow) -> EmployeeListItem:
    e = row.employee
    return EmployeeListItem(
        id=e.id,
        employee_code=e.employee_code,
        first_name=e.first_name,
        last_name=e.last_name,
        gender=e.gender,
        email=e.email,
        department=DepartmentOut.model_validate(e.department),
        country=CountryOut.model_validate(e.country),
        role_title=e.role_title,
        level=e.level,
        hire_date=e.hire_date,
        status=e.status,
        current_salary=row.current_salary,
        current_currency=row.current_currency,
    )


def _get_or_404(db: Session, employee_id: int) -> Employee:
    employee = crud.get_employee(db, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def _to_detail(db: Session, employee: Employee) -> EmployeeDetail:
    current = current_salary_for_employee(db, employee.id)
    return EmployeeDetail(
        id=employee.id,
        employee_code=employee.employee_code,
        first_name=employee.first_name,
        last_name=employee.last_name,
        gender=employee.gender,
        email=employee.email,
        department=DepartmentOut.model_validate(employee.department),
        country=CountryOut.model_validate(employee.country),
        role_title=employee.role_title,
        level=employee.level,
        hire_date=employee.hire_date,
        status=employee.status,
        current_salary=current.amount if current else None,
        current_currency=current.currency if current else None,
        salary_history=[SalaryHistoryOut.model_validate(h) for h in employee.salary_history],
    )


@router.get("/employees", response_model=EmployeeListResponse)
def list_employees(
    search: str | None = None,
    department_id: int | None = None,
    country_id: int | None = None,
    gender: str | None = None,
    level: str | None = None,
    status: str | None = "active",
    sort_by: str = "last_name",
    sort_dir: str = "asc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rows, total = crud.list_employees(
        db,
        search=search,
        department_id=department_id,
        country_id=country_id,
        gender=gender,
        level=level,
        status=status,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    return EmployeeListResponse(
        items=[_to_list_item(r) for r in rows], total=total, page=page, page_size=page_size
    )


@router.post("/employees", response_model=EmployeeDetail, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    try:
        employee = crud.create_employee(db, payload)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="An employee with this email already exists") from exc
    return _to_detail(db, employee)


@router.get("/employees/{employee_id}", response_model=EmployeeDetail)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = _get_or_404(db, employee_id)
    return _to_detail(db, employee)


@router.put("/employees/{employee_id}", response_model=EmployeeDetail)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    employee = _get_or_404(db, employee_id)
    employee = crud.update_employee(db, employee, payload)
    return _to_detail(db, employee)


@router.delete("/employees/{employee_id}", response_model=EmployeeDetail)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = _get_or_404(db, employee_id)
    employee = crud.soft_delete_employee(db, employee)
    return _to_detail(db, employee)


@router.get("/employees/{employee_id}/salary-history", response_model=list[SalaryHistoryOut])
def list_salary_history(employee_id: int, db: Session = Depends(get_db)):
    employee = _get_or_404(db, employee_id)
    return [SalaryHistoryOut.model_validate(h) for h in employee.salary_history]


@router.post("/employees/{employee_id}/salary-history", response_model=SalaryHistoryOut, status_code=201)
def create_salary_history(employee_id: int, payload: SalaryHistoryCreate, db: Session = Depends(get_db)):
    _get_or_404(db, employee_id)
    row = crud.add_salary_history(db, employee_id, payload)
    return SalaryHistoryOut.model_validate(row)


@router.delete("/employees/{employee_id}/salary-history/{history_id}", status_code=204)
def delete_salary_history(employee_id: int, history_id: int, db: Session = Depends(get_db)):
    _get_or_404(db, employee_id)
    ok = crud.delete_salary_history(db, employee_id, history_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot delete the only salary record for an employee")
