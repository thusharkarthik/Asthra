import pytest

from shared_utils import clamp_limit_offset, require_non_empty_string


def test_require_non_empty_string():
    assert require_non_empty_string(" value ", "name") == "value"
    with pytest.raises(ValueError):
        require_non_empty_string(" ", "name")


def test_clamp_limit_offset():
    assert clamp_limit_offset(None, None) == (100, 0)
    assert clamp_limit_offset(-1, -1) == (100, 0)
    assert clamp_limit_offset(1000, 5, max_limit=200) == (200, 5)
