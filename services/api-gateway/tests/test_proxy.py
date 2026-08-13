import asyncio
from types import SimpleNamespace

import httpx

from app.services.proxy import proxy_request


class FakeRequest:
    method = "POST"
    query_params = {"limit": "5"}
    headers = {
        "Authorization": "Bearer token",
        "X-Request-ID": "proxy-test",
        "Content-Type": "application/json",
    }
    state = SimpleNamespace(request_id="proxy-test")

    async def body(self) -> bytes:
        return b'{"hello":"world"}'


class FakeAsyncClient:
    calls = []

    def __init__(self, *args, **kwargs):
        self.timeout = kwargs.get("timeout")

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False

    async def request(self, **kwargs):
        self.__class__.calls.append(kwargs)
        return httpx.Response(status_code=200, json={"proxied": True})


def test_proxy_forwards_request(monkeypatch):
    FakeAsyncClient.calls = []
    monkeypatch.setattr("app.services.proxy.httpx.AsyncClient", FakeAsyncClient)

    response = asyncio.run(proxy_request(FakeRequest(), "http://core-service:8000", "api/v1/example"))

    assert response.status_code == 200
    assert FakeAsyncClient.calls[0]["method"] == "POST"
    assert FakeAsyncClient.calls[0]["url"] == "http://core-service:8000/api/v1/example"
    assert FakeAsyncClient.calls[0]["params"]["limit"] == "5"
    assert FakeAsyncClient.calls[0]["headers"]["Authorization"] == "Bearer token"
    assert FakeAsyncClient.calls[0]["headers"]["X-Request-ID"] == "proxy-test"
    assert FakeAsyncClient.calls[0]["headers"]["Content-Type"] == "application/json"
