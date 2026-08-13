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


def test_archived_project_detail_can_be_restored(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])
    create_response = client.post(
        "/api/v1/projects",
        json={"workspace_id": workspace["id"], "name": "Archive Me", "status": "active"},
        headers=headers,
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    archive_response = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"status": "archived", "is_active": False},
        headers=headers,
    )
    assert archive_response.status_code == 200
    assert archive_response.json()["is_active"] is False

    detail_response = client.get(f"/api/v1/projects/{project_id}", headers=headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["status"] == "archived"
    assert detail_response.json()["workspace_id"] == workspace["id"]
    assert detail_response.json()["organization_id"] == organization["id"]

    restore_response = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"status": "active", "is_active": True},
        headers=headers,
    )
    assert restore_response.status_code == 200
    assert restore_response.json()["is_active"] is True
    assert restore_response.json()["status"] == "active"
