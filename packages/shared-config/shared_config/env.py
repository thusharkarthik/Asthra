import os
from typing import Any


def get_env(name: str, default: Any = None, required: bool = False) -> Any:
    value = os.getenv(name)
    if value is None:
        if required:
            raise RuntimeError(f"Required environment variable is missing: {name}")
        return default
    return value


def get_bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def get_int_env(name: str, default: int = 0) -> int:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    try:
        return int(value)
    except ValueError:
        return default


def get_list_env(name: str, separator: str = ",") -> list[str]:
    value = os.getenv(name)
    if not value:
        return []
    return [item.strip() for item in value.split(separator) if item.strip()]
