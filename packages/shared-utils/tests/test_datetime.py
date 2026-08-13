from datetime import datetime, timezone

from shared_utils import to_iso_datetime, utc_now


def test_utc_now():
    now = utc_now()

    assert now.tzinfo == timezone.utc


def test_to_iso_datetime():
    value = datetime(2026, 6, 2, 10, 0, 0)

    assert to_iso_datetime(value).startswith("2026-06-02T10:00:00")
    assert to_iso_datetime(None) is None
