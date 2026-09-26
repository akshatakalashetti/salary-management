import datetime as dt

from pydantic import BaseModel, ConfigDict, Field

from app.models.leave import LEAVE_STATUSES, LEAVE_TYPES


class LeaveBalanceSummary(BaseModel):
    leave_type: str
    total_days: int
    used_days: int
    pending_days: int
    available_days: int


class LeaveRequestCreate(BaseModel):
    leave_type: str
    start_date: dt.date
    end_date: dt.date
    reason: str | None = None

    @property
    def days(self) -> int:
        return (self.end_date - self.start_date).days + 1


class LeaveRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    leave_type: str
    start_date: dt.date
    end_date: dt.date
    days: int
    reason: str | None
    status: str
    created_at: dt.datetime


class LeaveStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(approved|rejected|cancelled)$")
