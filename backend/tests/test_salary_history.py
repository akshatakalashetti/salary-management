from tests.conftest import make_employee_payload


def test_later_effective_date_becomes_current_salary(client, departments, countries):
    created = client.post(
        "/api/v1/employees",
        json=make_employee_payload(departments["eng"].id, countries["us"].id, starting_salary="90000"),
    ).json()
    emp_id = created["id"]

    client.post(
        f"/api/v1/employees/{emp_id}/salary-history",
        json={"amount": "100000.00", "currency": "USD", "effective_date": "2023-01-15", "reason": "raise"},
    )

    detail = client.get(f"/api/v1/employees/{emp_id}").json()
    assert detail["current_salary"] == "100000.00"
    assert len(detail["salary_history"]) == 2


def test_earlier_effective_date_does_not_override_current_salary(client, departments, countries):
    created = client.post(
        "/api/v1/employees",
        json=make_employee_payload(
            departments["eng"].id, countries["us"].id, hire_date="2022-01-15", starting_salary="90000"
        ),
    ).json()
    emp_id = created["id"]

    # A backdated correction earlier than hire_date should NOT become "current" --
    # current salary is defined by max(effective_date), not by insertion order.
    resp = client.post(
        f"/api/v1/employees/{emp_id}/salary-history",
        json={"amount": "1.00", "currency": "USD", "effective_date": "2020-01-01", "reason": "correction"},
    )
    assert resp.status_code == 201

    detail = client.get(f"/api/v1/employees/{emp_id}").json()
    assert detail["current_salary"] == "90000.00"


def test_list_endpoint_current_salary_matches_detail_endpoint_for_multiple_employees(
    client, departments, countries
):
    ids = []
    for i in range(3):
        created = client.post(
            "/api/v1/employees",
            json=make_employee_payload(
                departments["eng"].id, countries["us"].id, email=f"p{i}@example.com", starting_salary="80000"
            ),
        ).json()
        ids.append(created["id"])
        client.post(
            f"/api/v1/employees/{created['id']}/salary-history",
            json={"amount": str(80000 + i * 1000), "currency": "USD", "effective_date": "2024-01-01", "reason": "raise"},
        )

    listing = {item["id"]: item["current_salary"] for item in client.get("/api/v1/employees").json()["items"]}
    for emp_id in ids:
        detail = client.get(f"/api/v1/employees/{emp_id}").json()
        assert listing[emp_id] == detail["current_salary"]


def test_cannot_delete_the_only_salary_record(client, departments, countries):
    created = client.post(
        "/api/v1/employees", json=make_employee_payload(departments["eng"].id, countries["us"].id)
    ).json()
    history_id = created["salary_history"][0]["id"]

    resp = client.delete(f"/api/v1/employees/{created['id']}/salary-history/{history_id}")
    assert resp.status_code == 400


def test_can_delete_a_correction_when_other_records_remain(client, departments, countries):
    created = client.post(
        "/api/v1/employees", json=make_employee_payload(departments["eng"].id, countries["us"].id)
    ).json()
    emp_id = created["id"]
    raise_resp = client.post(
        f"/api/v1/employees/{emp_id}/salary-history",
        json={"amount": "95000.00", "currency": "USD", "effective_date": "2023-01-01", "reason": "raise"},
    ).json()

    resp = client.delete(f"/api/v1/employees/{emp_id}/salary-history/{raise_resp['id']}")
    assert resp.status_code == 204

    detail = client.get(f"/api/v1/employees/{emp_id}").json()
    assert len(detail["salary_history"]) == 1
