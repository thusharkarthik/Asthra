import inspect

from app.main import app


def _call(path: str):
    for route in app.routes:
        if getattr(route, "path", None) == path:
            result = route.endpoint()
            if inspect.iscoroutine(result):
                raise AssertionError(f"Unexpected async endpoint for {path}")
            return result
    raise AssertionError(f"Route not found: {path}")


def test_health_and_ready():
    assert _call("/")["data"]["service"] == "asthra-discover-service"
    assert _call("/health")["data"]["status"] == "ok"
    assert _call("/ready")["data"]["database"] == "ok"
