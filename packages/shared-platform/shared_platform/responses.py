from typing import Any

from shared_platform.pagination import pagination_metadata


def success_response(data: Any = None, message: str | None = None, request_id: str | None = None) -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "message": message,
        "request_id": request_id,
    }


def error_response(
    code: str,
    message: str,
    request_id: str | None = None,
    details: Any = None,
) -> dict[str, Any]:
    error: dict[str, Any] = {
        "code": code,
        "message": message,
    }
    if details is not None:
        error["details"] = details
    return {
        "success": False,
        "error": error,
        "request_id": request_id,
    }


def paginated_response(
    data: list[Any],
    total: int | None = None,
    limit: int = 100,
    offset: int = 0,
    message: str | None = None,
    request_id: str | None = None,
) -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "message": message,
        "request_id": request_id,
        "pagination": pagination_metadata(total=total, limit=limit, offset=offset, count=len(data)),
    }
