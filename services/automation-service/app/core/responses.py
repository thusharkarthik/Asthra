from typing import Any


def success_response(data: Any = None, message: str | None = None) -> dict[str, Any]:
    return {"success": True, "message": message, "data": data, "error": None}


def error_response(
    message: str,
    code: str = "error",
    details: Any = None,
) -> dict[str, Any]:
    return {
        "success": False,
        "message": None,
        "data": None,
        "error": {"code": code, "message": message, "details": details},
    }
