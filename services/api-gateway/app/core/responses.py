from typing import Any


def success_response(data: Any = None, message: str | None = None, request_id: str | None = None) -> dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data,
        "error": None,
        "request_id": request_id,
    }


def error_response(
    message: str,
    code: str = "error",
    details: Any = None,
    request_id: str | None = None,
) -> dict[str, Any]:
    return {
        "success": False,
        "message": None,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "request_id": request_id,
    }
