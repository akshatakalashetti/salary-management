import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.reference import Country, Department
    from app.models.salary_history import SalaryHistory

PAY_FREQUENCIES = ("monthly", "biweekly", "weekly")


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        Index("ix_employees_department_id", "department_id"),
        Index("ix_employees_country_id", "country_id"),
        Index("ix_employees_gender", "gender"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(60), nullable=False)
    last_name: Mapped[str] = mapped_column(String(60), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"), nullable=False)

    role_title: Mapped[str] = mapped_column(String(80), nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    hire_date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    # --- Personal / contact ---
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    date_of_birth: Mapped[dt.date | None] = mapped_column(Date, nullable=True)

    # --- Address ---
    address_street: Mapped[str | None] = mapped_column(String(120), nullable=True)
    address_city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    address_state: Mapped[str | None] = mapped_column(String(80), nullable=True)
    address_postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # --- Payroll / compensation ---
    pay_frequency: Mapped[str | None] = mapped_column(String(20), nullable=True, default="monthly")
    # Only last 4 digits stored — never a full account number in this system
    bank_last4: Mapped[str | None] = mapped_column(String(4), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # --- Emergency contact ---
    emergency_contact_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[dt.datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    department: Mapped["Department"] = relationship(back_populates="employees")
    country: Mapped["Country"] = relationship(back_populates="employees")
    salary_history: Mapped[list["SalaryHistory"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan", order_by="desc(SalaryHistory.effective_date)"
    )
