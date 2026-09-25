import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.reference import Country, Department
    from app.models.salary_history import SalaryHistory


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

    created_at: Mapped[dt.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[dt.datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    department: Mapped["Department"] = relationship(back_populates="employees")
    country: Mapped["Country"] = relationship(back_populates="employees")
    salary_history: Mapped[list["SalaryHistory"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan", order_by="desc(SalaryHistory.effective_date)"
    )
