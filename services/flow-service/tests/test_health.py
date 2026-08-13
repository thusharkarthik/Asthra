from app.main import app


def _route_endpoint(path: str):
    return next(route.endpoint for route in app.routes if route.path == path)


def test_health_endpoint():
    payload = _route_endpoint("/health")()

    assert payload["success"] is True
    assert payload["data"]["status"] == "ok"
    assert payload["data"]["service"] == "asthra-flow-service"


def test_ready_endpoint(db):
    payload = _route_endpoint("/ready")()

    assert payload["success"] is True
    assert payload["data"]["status"] == "ready"
