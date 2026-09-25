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
    # Personal / contact
    phone: str | None = None
    date_of_birth: dt.date | None = None
    # Address
    address_street: str | None = None
    address_city: str | None = None
    address_state: str | None = None
    address_postal_code: str | None = None
    # Payroll
    pay_frequency: str | None = None
    bank_last4: str | None = Field(default=None, max_length=4, pattern=r"^\d{4}$|^$")
    tax_id: str | None = None
    # Emergency contact
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


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


class EmployeeProfileSections(BaseModel):
    """Extended fields shown in the HR detail view and the employee's own profile."""
    model_config = ConfigDict(from_attributes=True)
    # Personal / contact
    phone: str | None
    date_of_birth: dt.date | None
    # Address
    address_street: str | None
    address_city: str | None
    address_state: str | None
    address_postal_code: str | None
    # Payroll
    pay_frequency: str | None
    bank_last4: str | None
    tax_id: str | None
    # Emergency contact
    emergency_contact_name: str | None
    emergency_contact_phone: str | None


class EmployeeDetail(EmployeeListItem, EmployeeProfileSections):
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
    "EmployeeProfileSections",
    "EmployeeListResponse",
    "SalaryHistoryCreate",
]
