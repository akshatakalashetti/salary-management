from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.employee import Employee


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)

    employees: Mapped[list["Employee"]] = relationship(back_populates="department")


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    iso_code: Mapped[str] = mapped_column(String(2), unique=True, nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False)

    employees: Mapped[list["Employee"]] = relationship(back_populates="country")
