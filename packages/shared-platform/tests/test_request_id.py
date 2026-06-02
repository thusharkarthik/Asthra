from uuid import UUID

from shared_platform.request_id import generate_request_id, get_request_id_from_headers


def test_generate_request_id():
    request_id = generate_request_id()

    assert UUID(request_id)


def test_get_request_id_from_headers():
    assert get_request_id_from_headers({"X-Request-ID": "req-1"}) == "req-1"
    assert get_request_id_from_headers({"x-request-id": "req-2"}) == "req-2"
    assert get_request_id_from_headers({}) is None
