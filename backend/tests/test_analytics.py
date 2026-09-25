from app.analytics.aggregation import SalaryPoint, group_by, org_summary, summarize


def _point(
    employee_id,
    department="Engineering",
    country="United States",
    level="L3",
    gender="female",
    salary=100_000,
):
    return SalaryPoint(
        employee_id=employee_id,
        department=department,
        country=country,
        level=level,
        gender=gender,
        salary=salary,
    )


def test_summarize_median_with_odd_count():
    stats = summarize([10.0, 20.0, 30.0])
    assert stats.median == 20.0
    assert stats.avg == 20.0
    assert stats.min == 10.0
    assert stats.max == 30.0


def test_summarize_median_with_even_count():
    stats = summarize([10.0, 20.0, 30.0, 40.0])
    assert stats.median == 25.0  # average of the two middle values


def test_summarize_empty_returns_none():
    assert summarize([]) is None


def test_group_by_department_computes_independent_stats_per_bucket():
    points = [
        _point(1, department="Engineering", salary=100_000),
        _point(2, department="Engineering", salary=200_000),
        _point(3, department="Sales", salary=50_000),
    ]
    grouped = group_by(points, key_fn=lambda p: p.department)
    assert grouped["Engineering"].count == 2
    assert grouped["Engineering"].median == 150_000
    assert grouped["Sales"].count == 1
    assert grouped["Sales"].median == 50_000


def test_group_by_omits_empty_department_no_crash():
    # A department with zero current employees simply never appears as a key
    # (there's nothing to divide by), rather than raising or emitting a
    # zero-filled row.
    grouped = group_by([], key_fn=lambda p: p.department)
    assert grouped == {}


def test_org_summary_covers_all_points_regardless_of_grouping():
    points = [_point(1, salary=100_000), _point(2, salary=300_000)]
    stats = org_summary(points)
    assert stats.count == 2
    assert stats.avg == 200_000
    assert stats.median == 200_000
