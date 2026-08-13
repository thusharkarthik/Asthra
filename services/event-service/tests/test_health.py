from app.main import create_app


def test_health_ready_and_system_routes_exist():
    app = create_app()
    paths = {route.path for route in app.routes}

    assert "/health" in paths
    assert "/ready" in paths
    assert "/api/v1/system/info" in paths
