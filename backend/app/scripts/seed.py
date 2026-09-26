"""Seed the database with a realistic, synthetic set of 10,000 employees.

Run with: python -m app.scripts.seed [--count 10000]

Design notes (see docs/ARCHITECTURE.md and docs/TRADEOFFS.md for more):
- Deterministic (Faker + random both seeded) so re-running produces the
  same dataset -- useful for demos and for reasoning about the analytics
  output.
- Bulk inserts (SQLAlchemy Core `insert(...)` with a list of dicts), not
  10,000 individual ORM `session.add()` + `session.commit()` calls, so
  the whole seed runs in a few seconds.
- Idempotent: wipes existing employees/salary_history/departments/
  countries before inserting, so it's safe to re-run.
- Deliberately injects synthetic pay outliers and a gender pay gap in a
  subset of cohorts so the analytics/equity features have real signal
  to demonstrate. This is a synthetic dataset, not a claim about any
  real organization -- called out in docs/requirements.md too.
"""

import argparse
import datetime as dt
import random

from faker import Faker
from sqlalchemy import delete, insert

import bcrypt as _bcrypt

def _hash_seed(plain: str) -> str:
    """Low-cost hash for seeded data (rounds=4). Only used here.
    Real user-created passwords use the full 12-round cost in core/auth.py.
    """
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(rounds=4)).decode()
from app.db.base import Base, SessionLocal, engine
from app.models import Country, Department, Employee, SalaryHistory, User
from app.scripts.seed_data import (
    BASE_SALARY_BY_LEVEL_AND_COUNTRY,
    COUNTRIES,
    DEPARTMENTS,
    GENDERS_WEIGHTED,
    LEVELS,
    ROLE_TITLES_BY_DEPARTMENT,
)

SEED = 42
OUTLIER_FRACTION = 0.04  # ~4% of employees get an injected pay outlier
GENDER_GAP_DEPARTMENTS = {"Engineering", "Sales", "Finance"}  # cohorts where a synthetic gap is injected
GENDER_GAP_MULTIPLIER = (0.85, 0.92)  # applied to a subset of female employees in the above departments


def _weighted_choice(rng: random.Random, items: list[tuple]) -> tuple:
    """items: list of tuples where the last element is a weight."""
    weights = [item[-1] for item in items]
    return rng.choices(items, weights=weights, k=1)[0]


PAY_FREQUENCIES = ["monthly", "biweekly"]


def reset_schema(session) -> None:
    # Drop and recreate all tables so schema changes (new columns, new tables)
    # are always applied, even if an old DB file exists on the volume.
    # Use the global engine (not the session's bind) because after drop_all
    # the session needs a fresh connection to see the recreated tables.
    session.close()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_reference_data(session) -> tuple[dict[str, int], dict[str, dict]]:
    dept_rows = [{"name": name, "code": code} for name, code, _ in DEPARTMENTS]
    session.execute(insert(Department), dept_rows)
    session.commit()
    dept_ids = {d.name: d.id for d in session.query(Department).all()}

    country_rows = [{"name": name, "iso_code": iso, "currency_code": cur} for name, iso, cur, _ in COUNTRIES]
    session.execute(insert(Country), country_rows)
    session.commit()
    country_by_name = {
        c.name: {"id": c.id, "iso_code": c.iso_code, "currency_code": c.currency_code}
        for c in session.query(Country).all()
    }
    return dept_ids, country_by_name


def _random_hire_date(rng: random.Random, today: dt.date) -> dt.date:
    days_back = rng.randint(30, 365 * 10)
    return today - dt.timedelta(days=days_back)


def _base_salary(iso_code: str, level_code: str, rng: random.Random) -> float:
    base = BASE_SALARY_BY_LEVEL_AND_COUNTRY[(iso_code, level_code)]
    noise = rng.gauss(1.0, 0.08)  # +/- ~8% realistic variance around the base
    return round(base * max(noise, 0.6), 2)


def generate_employees(count: int, dept_ids: dict, countries: dict, faker: Faker, rng: random.Random):
    today = dt.date.today()
    employees: list[dict] = []
    salary_rows: list[dict] = []

    for i in range(1, count + 1):
        dept_name, dept_code, _ = _weighted_choice(rng, DEPARTMENTS)
        country_name, iso_code, currency_code, _ = _weighted_choice(rng, COUNTRIES)
        level_code, _level_label, _ = _weighted_choice(rng, LEVELS)
        gender, _ = _weighted_choice(rng, GENDERS_WEIGHTED)
        role_title = rng.choice(ROLE_TITLES_BY_DEPARTMENT[dept_name])
        hire_date = _random_hire_date(rng, today)

        first_name = faker.first_name()
        last_name = faker.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}.{i}@acme-corp.example"

        salary = _base_salary(iso_code, level_code, rng)

        # Inject a synthetic gender pay gap in a subset of cohorts, so the
        # equity endpoint has real signal to flag. Purely synthetic.
        if dept_name in GENDER_GAP_DEPARTMENTS and gender == "female" and rng.random() < 0.35:
            salary = round(salary * rng.uniform(*GENDER_GAP_MULTIPLIER), 2)

        # Inject synthetic outliers (over- and under-paid) independent of gender.
        if rng.random() < OUTLIER_FRACTION:
            direction = rng.choice([1, -1])
            magnitude = rng.uniform(0.25, 0.55)
            salary = round(salary * (1 + direction * magnitude), 2)

        employees.append(
            {
                "employee_code": f"EMP-{i:06d}",
                "first_name": first_name,
                "last_name": last_name,
                "gender": gender,
                "email": email,
                "department_id": dept_ids[dept_name],
                "country_id": countries[country_name]["id"],
                "role_title": role_title,
                "level": level_code,
                "hire_date": hire_date,
                "status": "active",
                # Personal / contact — phone truncated to 30 chars max
                "phone": faker.phone_number()[:30],
                "date_of_birth": faker.date_of_birth(minimum_age=22, maximum_age=60),
                # Address
                "address_street": faker.street_address(),
                "address_city": faker.city(),
                "address_state": faker.state(),
                "address_postal_code": faker.postcode(),
                # Payroll
                "pay_frequency": rng.choice(PAY_FREQUENCIES),
                "bank_last4": str(rng.randint(1000, 9999)),
                "tax_id": faker.ssn(),
                # Emergency contact
                "emergency_contact_name": faker.name(),
                "emergency_contact_phone": faker.phone_number()[:30],
            }
        )

        salary_rows.append(
            {
                "employee_code": employees[-1]["employee_code"],  # resolved to employee_id after insert
                "amount": salary,
                "currency": currency_code,
                "effective_date": hire_date,
                "reason": "hire",
            }
        )

        # ~40% of employees who've been hired over a year ago get 1-2 raises,
        # so "current salary" meaningfully differs from "hire salary" for a
        # large chunk of the dataset.
        tenure_days = (today - hire_date).days
        if tenure_days > 365 and rng.random() < 0.4:
            num_raises = rng.choice([1, 1, 2])
            last_date = hire_date
            last_salary = salary
            for _ in range(num_raises):
                raise_date = last_date + dt.timedelta(days=rng.randint(200, 400))
                if raise_date >= today:
                    break
                last_salary = round(last_salary * rng.uniform(1.04, 1.15), 2)
                salary_rows.append(
                    {
                        "employee_code": employees[-1]["employee_code"],
                        "amount": last_salary,
                        "currency": currency_code,
                        "effective_date": raise_date,
                        "reason": "raise",
                    }
                )
                last_date = raise_date

    return employees, salary_rows


def run(count: int) -> None:
    Base.metadata.create_all(bind=engine)
    faker = Faker()
    Faker.seed(SEED)
    rng = random.Random(SEED)

    # reset_schema drops/recreates all tables; we need a fresh session after.
    session = SessionLocal()
    reset_schema(session)
    session = SessionLocal()
    try:
        dept_ids, countries = seed_reference_data(session)

        employees, salary_rows = generate_employees(count, dept_ids, countries, faker, rng)

        session.execute(insert(Employee), employees)
        session.commit()

        code_to_id = {e.employee_code: e.id for e in session.query(Employee.id, Employee.employee_code)}
        for row in salary_rows:
            row["employee_id"] = code_to_id[row.pop("employee_code")]

        session.execute(insert(SalaryHistory), salary_rows)
        session.commit()

        print(f"Seeded {len(employees)} employees and {len(salary_rows)} salary_history rows.", flush=True)
        for dept_name, _, _ in DEPARTMENTS:
            n = sum(1 for e in employees if e["department_id"] == dept_ids[dept_name])
            print(f"  {dept_name:20s}: {n}", flush=True)

        # --- Users ---
        print("Creating user accounts...", flush=True)
        try:
            # One HR admin account
            session.add(
                User(
                    email="hr@acme-corp.example",
                    password_hash=_hash_seed("hr-password"),
                    role="hr",
                    employee_id=None,
                )
            )
            session.commit()

            # One employee login per employee (email = work email, password = employee_code).
            # Pre-compute a single shared hash per employee at low bcrypt cost (rounds=4)
            # so the seed completes in seconds rather than hours.
            all_employees = session.query(Employee.id, Employee.email, Employee.employee_code).all()
            user_rows = [
                {
                    "email": emp.email,
                    "password_hash": _hash_seed(emp.employee_code),
                    "role": "employee",
                    "employee_id": emp.id,
                }
                for emp in all_employees
            ]
            # Batch in chunks to stay within SQLite's variable limit
            chunk = 500
            for start in range(0, len(user_rows), chunk):
                session.execute(insert(User), user_rows[start : start + chunk])
            session.commit()

            print(f"Seeded {len(user_rows) + 1} user accounts (1 HR + {len(user_rows)} employees).", flush=True)
            print("  HR login:       hr@acme-corp.example / hr-password", flush=True)
            print("  Employee login: <their work email> / <their EMP-XXXXXX code>", flush=True)
        except Exception as exc:
            print(f"WARNING: user creation failed — {exc}", flush=True)
            import traceback

            traceback.print_exc()
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=10_000)
    args = parser.parse_args()
    run(args.count)


if __name__ == "__main__":
    main()
