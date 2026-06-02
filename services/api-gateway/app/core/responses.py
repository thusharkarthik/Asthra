from typing import Any

try:
    from shared_platform.responses import error_response as shared_error_response
    from shared_platform.responses import success_response as shared_success_response
except ImportError:  # pragma: no cover - fallback for services before package installation
    shared_error_response = None
    shared_success_response = None


def success_response(data: Any = None, message: str | None = None, request_id: str | None = None) -> dict[str, Any]:
    if shared_success_response is not None:
        response = shared_success_response(data=data, message=message, request_id=request_id)
        response.setdefault("error", None)
        return response
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
    if shared_error_response is not None:
        response = shared_error_response(
            code=code,
            message=message,
            details=details,
            request_id=request_id,
        )
        response.setdefault("message", None)
        response.setdefault("data", None)
        return response
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
