from app.main import app


def _call(path: str):
    for route in app.routes:
        if getattr(route, "path", None) == path:
            return route.endpoint()
    raise AssertionError(f"Route not found: {path}")


def test_health_and_readiness():
    assert _call("/")["data"]["service"] == "asthra-desk-service"
    assert _call("/health")["data"]["status"] == "ok"
    assert _call("/ready")["data"]["database"] == "ok"
