from tests.conftest import make_employee_payload


def _create(client, dept_id, country_id, **overrides):
    return client.post("/api/v1/employees", json=make_employee_payload(dept_id, country_id, **overrides)).json()


def test_search_matches_partial_name(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, first_name="Alice", email="alice@example.com")
    _create(client, departments["eng"].id, countries["us"].id, first_name="Bob", email="bob@example.com")

    resp = client.get("/api/v1/employees", params={"search": "alic"})
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["first_name"] == "Alice"


def test_filter_by_department(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com")
    _create(client, departments["sales"].id, countries["us"].id, email="b@example.com")

    resp = client.get("/api/v1/employees", params={"department_id": departments["sales"].id})
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["department"]["code"] == "SAL"


def test_filter_by_country_and_gender_combined(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="a@example.com", gender="female")
    _create(client, departments["eng"].id, countries["us"].id, email="b@example.com", gender="male")
    _create(client, departments["eng"].id, countries["in"].id, email="c@example.com", gender="female")

    resp = client.get(
        "/api/v1/employees", params={"country_id": countries["us"].id, "gender": "female"}
    )
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["email"] == "a@example.com"


def test_pagination_returns_correct_total_and_page_slices(client, departments, countries):
    for i in range(5):
        _create(client, departments["eng"].id, countries["us"].id, email=f"person{i}@example.com", last_name=f"Z{i}")

    page1 = client.get("/api/v1/employees", params={"page": 1, "page_size": 2, "sort_by": "last_name"}).json()
    page2 = client.get("/api/v1/employees", params={"page": 2, "page_size": 2, "sort_by": "last_name"}).json()
    page3 = client.get("/api/v1/employees", params={"page": 3, "page_size": 2, "sort_by": "last_name"}).json()

    assert page1["total"] == page2["total"] == page3["total"] == 5
    assert len(page1["items"]) == 2
    assert len(page2["items"]) == 2
    assert len(page3["items"]) == 1
    all_ids = {item["id"] for p in (page1, page2, page3) for item in p["items"]}
    assert len(all_ids) == 5  # no duplicates/gaps across pages


def test_sort_by_current_salary_desc(client, departments, countries):
    _create(client, departments["eng"].id, countries["us"].id, email="low@example.com", starting_salary="50000")
    _create(client, departments["eng"].id, countries["us"].id, email="high@example.com", starting_salary="150000")

    resp = client.get("/api/v1/employees", params={"sort_by": "current_salary", "sort_dir": "desc"}).json()
    assert [item["email"] for item in resp["items"]] == ["high@example.com", "low@example.com"]
