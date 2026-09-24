import datetime as dt
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.reference import CountryOut, DepartmentOut
from app.schemas.salary_history import SalaryHistoryCreate, SalaryHistoryOut

GENDERS = ("male", "female", "other")
STATUSES = ("active", "terminated")


class EmployeeBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    gender: str
    email: EmailStr
    department_id: int
    country_id: int
    role_title: str = Field(min_length=1, max_length=80)
    level: str = Field(min_length=1, max_length=20)
    hire_date: dt.date


class EmployeeCreate(EmployeeBase):
    starting_salary: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)


class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=60)
    last_name: str | None = Field(default=None, min_length=1, max_length=60)
    gender: str | None = None
    department_id: int | None = None
    country_id: int | None = None
    role_title: str | None = Field(default=None, min_length=1, max_length=80)
    level: str | None = Field(default=None, min_length=1, max_length=20)
    status: str | None = None


class EmployeeListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_code: str
    first_name: str
    last_name: str
    gender: str
    email: str
    department: DepartmentOut
    country: CountryOut
    role_title: str
    level: str
    hire_date: dt.date
    status: str
    current_salary: Decimal | None
    current_currency: str | None


class EmployeeDetail(EmployeeListItem):
    salary_history: list[SalaryHistoryOut]


class EmployeeListResponse(BaseModel):
    items: list[EmployeeListItem]
    total: int
    page: int
    page_size: int


__all__ = [
    "GENDERS",
    "STATUSES",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeListItem",
    "EmployeeDetail",
    "EmployeeListResponse",
    "SalaryHistoryCreate",
]
