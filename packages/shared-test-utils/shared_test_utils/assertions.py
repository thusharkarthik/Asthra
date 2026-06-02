def assert_success_response(response: dict) -> None:
    assert response["success"] is True
    assert "data" in response


def assert_error_response(response: dict) -> None:
    assert response["success"] is False
    assert "error" in response
    assert "code" in response["error"]
    assert "message" in response["error"]
