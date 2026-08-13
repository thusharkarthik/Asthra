from uuid import UUID

from shared_observability import generate_correlation_id, generate_request_id, get_correlation_id, get_request_id


def test_generate_ids():
    assert UUID(generate_request_id())
    assert UUID(generate_correlation_id())


def test_get_ids_from_headers():
    headers = {"X-Request-ID": "req-1", "x-correlation-id": "corr-1"}

    assert get_request_id(headers) == "req-1"
    assert get_correlation_id(headers) == "corr-1"
    assert get_request_id({}, generate_if_missing=False) is None
