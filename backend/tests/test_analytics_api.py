from tests.conftest import make_employee_payload


def _create(client, dept_id, country_id, **overrides):
    return client.post("/api/v1/employees", json=make_employee_payload(dept_id, country_id, **overrides)).json()


def test_summary_matches_hand_computed_values(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com", starting_salary="100000")
    _create(client, departments["eng"].id, countries["us"].id, email="b@example.com", starting_salary="200000")

    resp = client.get("/api/v1/analytics/summary").json()
    assert resp["headcount"] == 2
    assert resp["avg_salary"] == 150000.0
    assert resp["median_salary"] == 150000.0


def test_by_department_groups_correctly(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com", starting_salary="100000")
    _create(client, departments["sales"].id, countries["us"].id, email="b@example.com", starting_salary="50000")

    resp = client.get("/api/v1/analytics/by-department").json()
    by_key = {row["key"]: row for row in resp}
    assert by_key["Engineering"]["median"] == 100000.0
    assert by_key["Sales"]["median"] == 50000.0


def test_terminated_employees_excluded_from_analytics(client, departments, countries):
    created = _create(
        client, departments["eng"].id, countries["us"].id, email="a@example.com", starting_salary="500000"
    )
    client.delete(f"/api/v1/employees/{created['id']}")

    resp = client.get("/api/v1/analytics/summary").json()
    assert resp["headcount"] == 0


def test_equity_outliers_endpoint_reflects_threshold_param(client, departments, countries):
    for i in range(4):
        _create(
            client,
            departments["eng"].id,
            countries["us"].id,
            email=f"p{i}@example.com",
            starting_salary="100000",
            level="L3",
        )
    _create(
        client,
        departments["eng"].id,
        countries["us"].id,
        email="outlier@example.com",
        starting_salary="150000",
        level="L3",
    )

    strict = client.get("/api/v1/analytics/pay-equity/outliers", params={"threshold": 0.6}).json()
    loose = client.get("/api/v1/analytics/pay-equity/outliers", params={"threshold": 0.2}).json()
    assert strict == []
    assert len(loose) == 1
    assert loose[0]["employee_name"] == "Jane Doe"
