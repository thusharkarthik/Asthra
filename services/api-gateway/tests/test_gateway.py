from app.core.config import settings
from app.services.registry import service_registry_response


def test_gateway_info_route_exists(app):
    paths = {route.path for route in app.routes}

    assert "/api/gateway/info" in paths


def test_service_registry():
    services = service_registry_response()
    service_names = {service["name"] for service in services}

    assert settings.app_name == "asthra-api-gateway"
    assert "core-service" in service_names
    assert "media-service" in service_names
