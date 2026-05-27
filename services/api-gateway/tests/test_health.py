def test_health_and_ready_routes_exist(app):
    paths = {route.path for route in app.routes}

    assert "/health" in paths
    assert "/ready" in paths
