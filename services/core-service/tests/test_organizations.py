from tests.conftest import create_auth_headers


def test_create_organization(client):
    headers = create_auth_headers(client)

    response = client.post(
        "/api/v1/organizations",
        json={"name": "Acme", "description": "Primary organization"},
        headers=headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["name"] == "Acme"
    assert payload["description"] == "Primary organization"
    assert payload["is_active"] is True
    assert payload["created_by_id"] is not None
