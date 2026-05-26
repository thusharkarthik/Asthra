def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "ok"
    assert response.headers["x-request-id"]


def test_ready(client):
    response = client.get("/ready")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "ready"
    assert payload["data"]["database"] == "ok"


def test_system_info(client):
    response = client.get("/api/v1/system/info")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["service_name"] == "asthra-core-service"
    assert payload["data"]["environment"] == "test"
    assert payload["data"]["api_version"] == "/api/v1"
