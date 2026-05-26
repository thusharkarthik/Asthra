from tests.conftest import (
    create_auth_headers,
    create_test_organization,
    create_test_workspace,
)


def test_create_project(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])

    response = client.post(
        "/api/v1/projects",
        json={
            "workspace_id": workspace["id"],
            "name": "Core Platform",
            "description": "Core service project",
            "status": "active",
        },
        headers=headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["workspace_id"] == workspace["id"]
    assert payload["name"] == "Core Platform"
    assert payload["status"] == "active"
    assert payload["is_active"] is True
