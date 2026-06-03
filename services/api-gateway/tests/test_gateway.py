import asyncio

from app.core.config import settings
from app.services.registry import service_health_response, service_registry_response


EXPECTED_ROUTE_PREFIXES = {
    "core",
    "flow",
    "docs",
    "ai",
    "memory",
    "discover",
    "desk",
    "pulse",
    "dev",
    "collab",
    "automation",
    "connect",
    "guard",
    "insights",
    "media",
    "events",
}


def test_gateway_info_route_exists(app):
    paths = {route.path for route in app.routes}

    assert "/api/gateway/info" in paths
    assert "/api/gateway/services" in paths
    assert "/api/gateway/health/services" in paths


def test_service_registry():
    services = service_registry_response()
    service_names = {service["name"] for service in services}
    route_prefixes = {service["route_prefix"] for service in services}

    assert settings.app_name == "asthra-api-gateway"
    assert "core-service" in service_names
    assert "event-service" in service_names
    assert "media-service" in service_names
    assert EXPECTED_ROUTE_PREFIXES == route_prefixes


def test_all_proxy_route_prefixes_exist(app):
    paths = {route.path for route in app.routes}

    for prefix in EXPECTED_ROUTE_PREFIXES:
        assert f"/api/{prefix}/{{path:path}}" in paths


class FakeHealthAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False

    async def get(self, url):
        class Response:
            status_code = 200

        return Response()


def test_service_health_aggregation(monkeypatch):
    monkeypatch.setattr("app.services.registry.httpx.AsyncClient", FakeHealthAsyncClient)

    response = asyncio.run(service_health_response())

    assert response["status"] == "healthy"
    assert len(response["services"]) == len(EXPECTED_ROUTE_PREFIXES)
    assert all(service["status"] == "healthy" for service in response["services"])
