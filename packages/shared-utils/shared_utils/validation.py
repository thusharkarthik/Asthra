def require_non_empty_string(value: str | None, field_name: str = "value") -> str:
    if value is None or not value.strip():
        raise ValueError(f"{field_name} is required.")
    return value.strip()


def clamp_limit_offset(
    limit: int | None,
    offset: int | None,
    default_limit: int = 100,
    max_limit: int = 500,
) -> tuple[int, int]:
    normalized_limit = default_limit if limit is None else limit
    normalized_offset = 0 if offset is None else offset

    if normalized_limit < 1:
        normalized_limit = default_limit
    if normalized_limit > max_limit:
        normalized_limit = max_limit
    if normalized_offset < 0:
        normalized_offset = 0
    return normalized_limit, normalized_offset
