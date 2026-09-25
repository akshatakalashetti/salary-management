from tests.conftest import make_employee_payload


def test_create_employee_creates_initial_salary_history(client, departments, countries):
    payload = make_employee_payload(departments["eng"].id, countries["us"].id)
    resp = client.post("/api/v1/employees", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["employee_code"] == "EMP-000001"
    assert body["current_salary"] == "90000.00"
    assert len(body["salary_history"]) == 1
    assert body["salary_history"][0]["reason"] == "hire"


def test_create_employee_rejects_non_positive_salary(client, departments, countries):
    payload = make_employee_payload(departments["eng"].id, countries["us"].id, starting_salary="0")
    resp = client.post("/api/v1/employees", json=payload)
    assert resp.status_code == 422


def test_create_employee_rejects_missing_required_field(client, departments, countries):
    payload = make_employee_payload(departments["eng"].id, countries["us"].id)
    del payload["email"]
    resp = client.post("/api/v1/employees", json=payload)
    assert resp.status_code == 422


def test_create_employee_rejects_duplicate_email_with_409_not_500(client, departments, countries):
    payload = make_employee_payload(departments["eng"].id, countries["us"].id, email="dup@example.com")
    first = client.post("/api/v1/employees", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/employees", json=payload)
    assert second.status_code == 409
    assert "email" in second.json()["detail"].lower()


def test_get_employee_by_id(client, departments, countries):
    created = client.post(
        "/api/v1/employees", json=make_employee_payload(departments["eng"].id, countries["us"].id)
    ).json()
    resp = client.get(f"/api/v1/employees/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["email"] == "jane.doe@example.com"


def test_get_missing_employee_returns_404(client, departments, countries):
    resp = client.get("/api/v1/employees/9999")
    assert resp.status_code == 404


def test_update_employee_bio_fields(client, departments, countries):
    created = client.post(
        "/api/v1/employees", json=make_employee_payload(departments["eng"].id, countries["us"].id)
    ).json()
    resp = client.put(f"/api/v1/employees/{created['id']}", json={"role_title": "Senior Software Engineer"})
    assert resp.status_code == 200
    assert resp.json()["role_title"] == "Senior Software Engineer"
    # salary untouched by a bio update
    assert resp.json()["current_salary"] == "90000.00"


def test_soft_delete_sets_status_terminated_and_excludes_from_default_list(client, departments, countries):
    created = client.post(
        "/api/v1/employees", json=make_employee_payload(departments["eng"].id, countries["us"].id)
    ).json()
    resp = client.delete(f"/api/v1/employees/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "terminated"

    listing = client.get("/api/v1/employees").json()
    assert listing["total"] == 0

    listing_terminated = client.get("/api/v1/employees", params={"status": "terminated"}).json()
    assert listing_terminated["total"] == 1
