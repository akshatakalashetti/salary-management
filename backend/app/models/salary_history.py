import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.employee import Employee

REASONS = ("hire", "raise", "promotion", "correction", "adjustment")


class SalaryHistory(Base):
    __tablename__ = "salary_history"
    __table_args__ = (Index("ix_salary_history_employee_effective", "employee_id", "effective_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    effective_date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String(20), nullable=False, default="adjustment")
    created_at: Mapped[dt.datetime] = mapped_column(server_default=func.now())

    employee: Mapped["Employee"] = relationship(back_populates="salary_history")
