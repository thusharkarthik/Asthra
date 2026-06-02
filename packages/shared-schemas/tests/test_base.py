from shared_schemas import BaseResponse, ErrorDetail, ErrorResponse


def test_base_response_creation():
    response = BaseResponse[dict](data={"id": 1}, message="ok", request_id="req-1")

    assert response.success is True
    assert response.data == {"id": 1}
    assert response.request_id == "req-1"


def test_error_response_creation():
    response = ErrorResponse(error=ErrorDetail(code="not_found", message="Missing"), request_id="req-1")

    assert response.success is False
    assert response.error.code == "not_found"
    assert response.request_id == "req-1"
