from typing import Any


class AsthraError(Exception):
    code = "asthra_error"
    status_code = 500

    def __init__(self, message: str, details: Any = None):
        super().__init__(message)
        self.message = message
        self.details = details

    def to_dict(self) -> dict[str, Any]:
        error = {
            "code": self.code,
            "message": self.message,
        }
        if self.details is not None:
            error["details"] = self.details
        return error


class NotFoundError(AsthraError):
    code = "not_found"
    status_code = 404


class ValidationError(AsthraError):
    code = "validation_error"
    status_code = 400


class PermissionDeniedError(AsthraError):
    code = "permission_denied"
    status_code = 403


class ConflictError(AsthraError):
    code = "conflict"
    status_code = 409
