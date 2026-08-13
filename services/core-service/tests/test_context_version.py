from tests.conftest import auth_headers, create_auth_headers, create_test_organization, create_test_user, create_test_workspace, get_auth_token


def _create_project(client, headers, workspace_id: int, name: str = "Asthra Platform"):
    response = client.post(
        "/api/v1/projects",
        json={"workspace_id": workspace_id, "name": name, "description": "Test project", "status": "active"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def _context_version(client, headers, organization_id: int, workspace_id: int | None = None, project_id: int | None = None):
    params = {"organization_id": organization_id}
    if workspace_id is not None:
        params["workspace_id"] = workspace_id
    if project_id is not None:
        params["project_id"] = project_id
    response = client.get("/api/v1/context/version", params=params, headers=headers)
    assert response.status_code == 200
    return response.json()


def test_context_version_endpoint_returns_expected_shape(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])
    project = _create_project(client, headers, workspace["id"])

    payload = _context_version(client, headers, organization["id"], workspace["id"], project["id"])

    assert payload["user_id"] is not None
    assert payload["organization_id"] == organization["id"]
    assert payload["organization_version"] >= 1
    assert payload["workspace_id"] == workspace["id"]
    assert payload["workspace_version"] >= 1
    assert payload["project_id"] == project["id"]
    assert payload["project_version"] >= 1
    assert payload["access_version"] >= 1
    assert payload["generated_at"]


def test_organization_update_increments_organization_version(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    before = _context_version(client, headers, organization["id"])

    response = client.patch(
        f"/api/v1/organizations/{organization['id']}",
        json={"description": "Updated"},
        headers=headers,
    )
    assert response.status_code == 200

    after = _context_version(client, headers, organization["id"])
    assert after["organization_version"] > before["organization_version"]


def test_workspace_change_increments_organization_and_workspace_versions(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])
    before = _context_version(client, headers, organization["id"], workspace["id"])

    response = client.patch(
        f"/api/v1/workspaces/{workspace['id']}",
        json={"description": "Updated workspace"},
        headers=headers,
    )
    assert response.status_code == 200

    after = _context_version(client, headers, organization["id"], workspace["id"])
    assert after["organization_version"] > before["organization_version"]
    assert after["workspace_version"] > before["workspace_version"]


def test_project_change_increments_workspace_and_project_versions(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])
    project = _create_project(client, headers, workspace["id"])
    before = _context_version(client, headers, organization["id"], workspace["id"], project["id"])

    response = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"description": "Updated project"},
        headers=headers,
    )
    assert response.status_code == 200

    after = _context_version(client, headers, organization["id"], workspace["id"], project["id"])
    assert after["workspace_version"] > before["workspace_version"]
    assert after["project_version"] > before["project_version"]


def test_role_assignment_change_increments_access_version(client):
    owner_headers = create_auth_headers(client)
    organization = create_test_organization(client, owner_headers)
    create_test_user(client, email="member@example.com", full_name="Member User")
    member_headers = auth_headers(get_auth_token(client, email="member@example.com"))
    roles = client.get("/api/v1/roles", headers=owner_headers).json()
    role = next(item for item in roles if item["key"] == "organization_auditor")
    before = _context_version(client, owner_headers, organization["id"])

    response = client.post(
        "/api/v1/role-assignments",
        json={"user_id": client.get("/api/v1/auth/me", headers=member_headers).json()["id"], "role_id": role["id"], "scope_type": "organization", "scope_id": organization["id"]},
        headers=owner_headers,
    )
    assert response.status_code == 201

    after = _context_version(client, owner_headers, organization["id"])
    assert after["access_version"] > before["access_version"]
