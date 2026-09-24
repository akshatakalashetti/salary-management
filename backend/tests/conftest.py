import os

os.environ.setdefault("DATABASE_URL", "sqlite://")  # avoid touching disk when the app's startup event runs

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db.base import Base, get_db
from app.main import app
from app.models.reference import Country, Department


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def departments(db_session):
    depts = {
        "eng": Department(name="Engineering", code="ENG"),
        "sales": Department(name="Sales", code="SAL"),
    }
    db_session.add_all(depts.values())
    db_session.commit()
    for d in depts.values():
        db_session.refresh(d)
    return depts


@pytest.fixture()
def countries(db_session):
    countries = {
        "us": Country(name="United States", iso_code="US", currency_code="USD"),
        "in": Country(name="India", iso_code="IN", currency_code="INR"),
    }
    db_session.add_all(countries.values())
    db_session.commit()
    for c in countries.values():
        db_session.refresh(c)
    return countries


def make_employee_payload(dept_id: int, country_id: int, **overrides) -> dict:
    payload = {
        "first_name": "Jane",
        "last_name": "Doe",
        "gender": "female",
        "email": "jane.doe@example.com",
        "department_id": dept_id,
        "country_id": country_id,
        "role_title": "Software Engineer",
        "level": "L3",
        "hire_date": "2022-01-15",
        "starting_salary": "90000.00",
        "currency": "USD",
    }
    payload.update(overrides)
    return payload
