from tests.conftest import make_employee_payload


def _create(client, dept_id, country_id, **overrides):
    return client.post("/api/v1/employees", json=make_employee_payload(dept_id, country_id, **overrides)).json()


def test_summary_without_country_omits_blended_currency_stats(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com", starting_salary="100000")
    _create(client, departments["eng"].id, countries["in"].id, email="b@example.com", starting_salary="8000000")

    resp = client.get("/api/v1/analytics/summary").json()
    assert resp["headcount"] == 2
    # avg/median withheld: these two salaries are in different currencies
    # (USD, INR) and blending them would be meaningless without FX conversion.
    assert resp["avg_salary"] is None
    assert resp["median_salary"] is None


def test_summary_with_country_filter_computes_avg_and_median(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com", starting_salary="100000")
    _create(client, departments["eng"].id, countries["us"].id, email="b@example.com", starting_salary="200000")
    _create(client, departments["eng"].id, countries["in"].id, email="c@example.com", starting_salary="8000000")

    resp = client.get("/api/v1/analytics/summary", params={"country_id": countries["us"].id}).json()
    assert resp["headcount"] == 2
    assert resp["avg_salary"] == 150000.0
    assert resp["median_salary"] == 150000.0


def test_by_department_requires_country_id(client, departments, countries):
    resp = client.get("/api/v1/analytics/by-department")
    assert resp.status_code == 422


def test_by_department_groups_correctly_within_a_country(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com", starting_salary="100000")
    _create(client, departments["sales"].id, countries["us"].id, email="b@example.com", starting_salary="50000")
    # Different country/currency -- must not affect the US-scoped result.
    _create(client, departments["eng"].id, countries["in"].id, email="c@example.com", starting_salary="9000000")

    resp = client.get("/api/v1/analytics/by-department", params={"country_id": countries["us"].id}).json()
    by_key = {row["key"]: row for row in resp}
    assert by_key["Engineering"]["median"] == 100000.0
    assert by_key["Sales"]["median"] == 50000.0
    assert "count" in by_key["Engineering"]
    assert by_key["Engineering"]["count"] == 1


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
