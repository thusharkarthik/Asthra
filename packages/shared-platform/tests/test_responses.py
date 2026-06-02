from shared_platform.responses import error_response, paginated_response, success_response


def test_success_response():
    response = success_response(data={"id": 1}, message="Created", request_id="req-1")

    assert response["success"] is True
    assert response["data"]["id"] == 1
    assert response["message"] == "Created"
    assert response["request_id"] == "req-1"


def test_error_response():
    response = error_response(code="not_found", message="Missing", request_id="req-1")

    assert response["success"] is False
    assert response["error"]["code"] == "not_found"
    assert response["error"]["message"] == "Missing"
    assert response["request_id"] == "req-1"


def test_paginated_response():
    response = paginated_response(data=[1, 2], total=10, limit=2, offset=0)

    assert response["success"] is True
    assert response["pagination"]["count"] == 2
    assert response["pagination"]["has_next"] is True
