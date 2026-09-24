from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.reference import Country, Department
from app.schemas.reference import CountryOut, DepartmentOut

router = APIRouter(tags=["reference"])


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.execute(select(Department).order_by(Department.name)).scalars().all()


@router.get("/countries", response_model=list[CountryOut])
def list_countries(db: Session = Depends(get_db)):
    return db.execute(select(Country).order_by(Country.name)).scalars().all()
