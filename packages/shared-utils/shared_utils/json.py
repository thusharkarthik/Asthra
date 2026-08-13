import json
from typing import Any


def safe_json_dumps(value: Any, default: str = "{}") -> str:
    try:
        return json.dumps(value, default=str)
    except (TypeError, ValueError):
        return default


def safe_json_loads(value: str | bytes | None, default: Any = None) -> Any:
    if value is None:
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError, json.JSONDecodeError):
        return default
