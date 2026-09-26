import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_hr
from app.db.base import get_db
from app.models.leave import LEAVE_TYPES, LeaveBalance, LeaveRequest
from app.models.user import User
from app.schemas.leave import LeaveBalanceSummary, LeaveRequestCreate, LeaveRequestOut, LeaveStatusUpdate

router = APIRouter(prefix="/leave", tags=["leave"])

# Default annual allocations (days per year per type)
DEFAULT_BALANCES = {
    "earned": 21,
    "flexi": 5,
    "sick": 12,
    "casual": 7,
}


def _ensure_balance(db: Session, employee_id: int, year: int) -> dict[str, LeaveBalance]:
    """Create default leave balance rows if they don't exist yet for this year."""
    existing = {
        b.leave_type: b
        for b in db.execute(
            select(LeaveBalance).where(LeaveBalance.employee_id == employee_id, LeaveBalance.year == year)
        ).scalars().all()
    }
    for leave_type, days in DEFAULT_BALANCES.items():
        if leave_type not in existing:
            balance = LeaveBalance(
                employee_id=employee_id,
                year=year,
                leave_type=leave_type,
                total_days=days,
            )
            db.add(balance)
            existing[leave_type] = balance
    db.commit()
    return existing


def _get_used_days(db: Session, employee_id: int, year: int, leave_type: str, exclude_rejected: bool = True) -> dict:
    """Returns (used, pending) days for a given type and year."""
    requests = db.execute(
        select(LeaveRequest).where(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.leave_type == leave_type,
        )
    ).scalars().all()

    used = sum(
        r.days for r in requests
        if r.status == "approved"
        and r.start_date.year == year
    )
    pending = sum(
        r.days for r in requests
        if r.status == "pending"
        and r.start_date.year == year
    )
    return {"used": used, "pending": pending}


@router.get("/balance", response_model=list[LeaveBalanceSummary])
def get_leave_balance(
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    year = year or dt.date.today().year
    employee_id = current_user.employee_id
    if employee_id is None:
        raise HTTPException(status_code=400, detail="HR users do not have a personal leave balance")

    balances = _ensure_balance(db, employee_id, year)
    result = []
    for leave_type, balance in balances.items():
        usage = _get_used_days(db, employee_id, year, leave_type)
        result.append(
            LeaveBalanceSummary(
                leave_type=leave_type,
                total_days=balance.total_days,
                used_days=usage["used"],
                pending_days=usage["pending"],
                available_days=max(0, balance.total_days - usage["used"] - usage["pending"]),
            )
        )
    # Consistent display order
    order = list(LEAVE_TYPES)
    return sorted(result, key=lambda x: order.index(x.leave_type) if x.leave_type in order else 99)


@router.get("/requests", response_model=list[LeaveRequestOut])
def list_leave_requests(
    employee_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "hr":
        # HR can see all or filter by employee
        stmt = select(LeaveRequest)
        if employee_id:
            stmt = stmt.where(LeaveRequest.employee_id == employee_id)
    else:
        # Employees only see their own
        stmt = select(LeaveRequest).where(LeaveRequest.employee_id == current_user.employee_id)

    requests = db.execute(stmt.order_by(LeaveRequest.created_at.desc())).scalars().all()
    return [LeaveRequestOut.model_validate(r) for r in requests]


@router.post("/requests", response_model=LeaveRequestOut, status_code=201)
def create_leave_request(
    payload: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.employee_id is None:
        raise HTTPException(status_code=400, detail="HR users cannot submit leave requests")
    if payload.leave_type not in LEAVE_TYPES:
        raise HTTPException(status_code=422, detail=f"leave_type must be one of {LEAVE_TYPES}")
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=422, detail="end_date must be on or after start_date")

    days = payload.days
    year = payload.start_date.year
    balances = _ensure_balance(db, current_user.employee_id, year)
    usage = _get_used_days(db, current_user.employee_id, year, payload.leave_type)
    balance = balances[payload.leave_type]
    available = balance.total_days - usage["used"] - usage["pending"]

    if days > available:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient {payload.leave_type} leave. Available: {available} days, requested: {days} days.",
        )

    request = LeaveRequest(
        employee_id=current_user.employee_id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        days=days,
        reason=payload.reason,
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return LeaveRequestOut.model_validate(request)


@router.patch("/requests/{request_id}/status", response_model=LeaveRequestOut)
def update_leave_status(
    request_id: int,
    payload: LeaveStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id)).scalar_one_or_none()
    if request is None:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # HR can approve/reject; employee can only cancel their own pending request
    if current_user.role == "hr":
        pass  # full access
    elif payload.status == "cancelled" and request.employee_id == current_user.employee_id:
        if request.status != "pending":
            raise HTTPException(status_code=400, detail="Can only cancel pending requests")
    else:
        raise HTTPException(status_code=403, detail="Not authorised")

    request.status = payload.status
    db.commit()
    db.refresh(request)
    return LeaveRequestOut.model_validate(request)
