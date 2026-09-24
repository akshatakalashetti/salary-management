import datetime as dt
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.salary_history import REASONS


class SalaryHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: Decimal
    currency: str
    effective_date: dt.date
    reason: str
    created_at: dt.datetime


class SalaryHistoryCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    effective_date: dt.date
    reason: str = Field(default="adjustment")

    @field_validator("reason")
    @classmethod
    def reason_must_be_known(cls, v: str) -> str:
        if v not in REASONS:
            raise ValueError(f"reason must be one of {REASONS}")
        return v
