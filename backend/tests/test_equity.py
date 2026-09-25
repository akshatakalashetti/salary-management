from app.analytics.aggregation import SalaryPoint
from app.analytics.equity import find_gender_gaps, find_outliers


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


def test_outlier_flagged_with_correct_deviation_pct():
    # cohort of 4 at 100k, one at 150k => median 100k, deviation exactly +50%
    points = [_point(i, salary=100_000) for i in range(1, 5)] + [_point(5, salary=150_000)]
    results = find_outliers(points, min_cohort_size=3, threshold=0.20)

    assert len(results) == 1
    assert results[0].employee_id == 5
    assert results[0].direction == "over"
    assert results[0].deviation_pct == 0.5


def test_no_outliers_when_all_within_threshold():
    points = [_point(i, salary=100_000 + i * 1000) for i in range(1, 6)]  # tight spread
    results = find_outliers(points, min_cohort_size=3, threshold=0.20)
    assert results == []


def test_cohort_below_minimum_size_is_excluded():
    points = [_point(1, salary=100_000), _point(2, salary=1_000_000)]  # only 2 members
    results = find_outliers(points, min_cohort_size=3, threshold=0.20)
    assert results == []


def test_countries_are_not_mixed_into_the_same_cohort():
    # Same department+level, different countries/currencies -- these must NOT
    # be compared against each other (no FX conversion is performed).
    points = [_point(i, country="United States", salary=100_000) for i in range(1, 4)] + [
        _point(10, country="India", salary=8_000_000)
    ]
    results = find_outliers(points, min_cohort_size=3, threshold=0.20)
    # The India employee is in a cohort of size 1 (below min_cohort_size) and
    # must not be flagged as an outlier against the US cohort's median.
    assert all(r.employee_id != 10 for r in results)


def test_gender_gap_detected_with_correct_gap_pct():
    points = [_point(i, gender="male", salary=120_000) for i in range(1, 4)] + [
        _point(i, gender="female", salary=100_000) for i in range(10, 13)
    ]
    results = find_gender_gaps(points, min_per_gender=2, threshold=0.10)
    assert len(results) == 1
    gap = results[0]
    assert gap.higher_gender == "male"
    assert gap.lower_gender == "female"
    assert round(gap.gap_pct, 4) == round((120_000 - 100_000) / 120_000, 4)


def test_gender_gap_not_flagged_below_threshold():
    points = [_point(i, gender="male", salary=101_000) for i in range(1, 4)] + [
        _point(i, gender="female", salary=100_000) for i in range(10, 13)
    ]
    results = find_gender_gaps(points, min_per_gender=2, threshold=0.10)
    assert results == []


def test_gender_gap_requires_minimum_per_gender():
    points = [_point(i, gender="male", salary=150_000) for i in range(1, 4)] + [
        _point(10, gender="female", salary=90_000)  # only 1 female -- below min_per_gender
    ]
    results = find_gender_gaps(points, min_per_gender=2, threshold=0.10)
    assert results == []
