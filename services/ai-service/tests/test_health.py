import inspect

from app.main import app


def _endpoint_for(path: str):
    for route in app.routes:
        if getattr(route, "path", None) == path:
            return route.endpoint
    raise AssertionError(f"Route not found: {path}")


def _call_endpoint(path: str):
    endpoint = _endpoint_for(path)
    result = endpoint()
    if inspect.iscoroutine(result):
        raise AssertionError(f"Unexpected async endpoint for {path}")
    return result


def test_health_endpoint_returns_service_status():
    response = _call_endpoint("/health")

    assert response["success"] is True
    assert response["data"]["status"] == "ok"
    assert response["data"]["service"] == "asthra-intelligence-service"


def test_ready_endpoint_returns_database_status():
    response = _call_endpoint("/ready")

    assert response["success"] is True
    assert response["data"]["status"] == "ready"
    assert response["data"]["database"] == "ok"
