from datetime import datetime

from shared_utils import safe_json_dumps, safe_json_loads


def test_safe_json_dumps():
    assert safe_json_dumps({"a": 1}) == '{"a": 1}'
    assert "2026-06-02" in safe_json_dumps({"date": datetime(2026, 6, 2)})


def test_safe_json_loads():
    assert safe_json_loads('{"a": 1}') == {"a": 1}
    assert safe_json_loads("bad", default={}) == {}
    assert safe_json_loads(None, default=[]) == []
