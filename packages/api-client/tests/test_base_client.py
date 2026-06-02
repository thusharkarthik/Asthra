import httpx
import pytest

from asthra_api_client import APIClientResponseError, BaseAPIClient


def test_base_client_request_headers(monkeypatch):
    calls = []

    def fake_request(**kwargs):
        calls.append(kwargs)
        return httpx.Response(200, json={"ok": True})

    monkeypatch.setattr("asthra_api_client.base.httpx.request", fake_request)

    client = BaseAPIClient("http://service", token="token", request_id="req-1", timeout=5)
    response = client.get("/health")

    assert response == {"ok": True}
    assert calls[0]["url"] == "http://service/health"
    assert calls[0]["headers"]["Authorization"] == "Bearer token"
    assert calls[0]["headers"]["X-Request-ID"] == "req-1"
    assert calls[0]["timeout"] == 5


def test_base_client_response_error(monkeypatch):
    def fake_request(**kwargs):
        return httpx.Response(404, json={"error": "missing"})

    monkeypatch.setattr("asthra_api_client.base.httpx.request", fake_request)

    client = BaseAPIClient("http://service")
    with pytest.raises(APIClientResponseError) as exc:
        client.get("/missing")

    assert exc.value.status_code == 404
    assert exc.value.response_body == {"error": "missing"}
