from tests.conftest import create_auth_headers, create_test_organization


def test_create_workspace(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)

    response = client.post(
        "/api/v1/workspaces",
        json={
            "organization_id": organization["id"],
            "name": "Engineering",
            "description": "Engineering workspace",
        },
        headers=headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["organization_id"] == organization["id"]
    assert payload["name"] == "Engineering"
    assert payload["is_active"] is True
