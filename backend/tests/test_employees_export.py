import csv
import io

from tests.conftest import make_employee_payload


def _create(client, dept_id, country_id, **overrides):
    return client.post(
        "/api/v1/employees", json=make_employee_payload(dept_id, country_id, **overrides)
    ).json()


def test_export_returns_csv_with_header_and_all_matching_rows(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com", first_name="Alice")
    _create(client, departments["sales"].id, countries["us"].id, email="b@example.com", first_name="Bob")

    resp = client.get("/api/v1/employees/export")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "attachment" in resp.headers["content-disposition"]

    rows = list(csv.reader(io.StringIO(resp.text)))
    header, data_rows = rows[0], rows[1:]
    assert header == [
        "employee_code",
        "first_name",
        "last_name",
        "gender",
        "email",
        "department",
        "country",
        "role_title",
        "level",
        "hire_date",
        "status",
        "current_salary",
        "current_currency",
    ]
    assert len(data_rows) == 2
    assert {row[1] for row in data_rows} == {"Alice", "Bob"}


def test_export_respects_department_filter_matching_list_endpoint(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com")
    _create(client, departments["sales"].id, countries["us"].id, email="b@example.com")

    list_resp = client.get("/api/v1/employees", params={"department_id": departments["sales"].id}).json()
    export_resp = client.get("/api/v1/employees/export", params={"department_id": departments["sales"].id})

    export_rows = list(csv.reader(io.StringIO(export_resp.text)))[1:]
    assert len(export_rows) == list_resp["total"] == 1
    assert export_rows[0][5] == "Sales"


def test_export_excludes_terminated_employees_by_default(client, departments, countries):
    created = _create(client, departments["eng"].id, countries["us"].id, email="a@example.com")
    client.delete(f"/api/v1/employees/{created['id']}")

    resp = client.get("/api/v1/employees/export")
    rows = list(csv.reader(io.StringIO(resp.text)))[1:]
    assert rows == []
