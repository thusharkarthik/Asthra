from shared_platform.pagination import normalize_limit_offset, pagination_metadata


def test_normalize_limit_offset():
    assert normalize_limit_offset(limit=-1, offset=-5) == (100, 0)
    assert normalize_limit_offset(limit=1000, offset=5, max_limit=200) == (200, 5)


def test_pagination_metadata():
    metadata = pagination_metadata(total=20, limit=10, offset=10, count=10)

    assert metadata["has_next"] is False
    assert metadata["has_previous"] is True
