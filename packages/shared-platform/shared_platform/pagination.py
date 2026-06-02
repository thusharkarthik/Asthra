def normalize_limit_offset(
    limit: int | None = None,
    offset: int | None = None,
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


def pagination_metadata(total: int | None, limit: int, offset: int, count: int | None = None) -> dict:
    metadata = {
        "limit": limit,
        "offset": offset,
        "count": count,
        "total": total,
    }
    if total is not None:
        metadata["has_next"] = offset + (count or 0) < total
        metadata["has_previous"] = offset > 0
    return metadata
