import pytest

from shared_events.naming import is_valid_dot_notation, validate_event_name


def test_event_name_validation():
    assert is_valid_dot_notation("core.organization.created") is True
    assert is_valid_dot_notation("flow.work_item.updated") is True
    assert is_valid_dot_notation("bad") is False
    assert validate_event_name("docs.page.updated") == "docs.page.updated"


def test_invalid_event_name_validation():
    with pytest.raises(ValueError):
        validate_event_name("Docs Page Updated")
