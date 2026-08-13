from shared_platform.errors import ConflictError, NotFoundError, PermissionDeniedError, ValidationError


def test_error_types():
    assert NotFoundError("Missing").status_code == 404
    assert ValidationError("Invalid").code == "validation_error"
    assert PermissionDeniedError("Denied").status_code == 403
    assert ConflictError("Duplicate").to_dict()["code"] == "conflict"
