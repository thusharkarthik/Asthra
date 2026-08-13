from tests.conftest import (
    auth_headers,
    create_auth_headers,
    create_test_organization,
    create_test_user,
    create_test_workspace,
    get_auth_token,
)
from fastapi.testclient import TestClient

from app.main import app


def test_role_permission_replacement_updates_effective_permissions_and_platform_context():
    client = TestClient(app)
    admin_headers = create_auth_headers(client, email="admin@example.com")
    user = create_test_user(client, email="rbac-user@example.com")
    user_headers = auth_headers(get_auth_token(client, email="rbac-user@example.com"))

    organization = create_test_organization(client, admin_headers, name="RBAC Org")
    workspace = create_test_workspace(client, admin_headers, organization["id"], name="RBAC Workspace")
    project_response = client.post(
        "/api/v1/projects",
        json={"workspace_id": workspace["id"], "name": "RBAC Project", "status": "active"},
        headers=admin_headers,
    )
    assert project_response.status_code == 201
    project = project_response.json()

    permissions = client.get("/api/v1/permissions", headers=admin_headers).json()
    view_permission = next(permission for permission in permissions if permission["code"] == "flow.work_item.view")
    create_permission = next(permission for permission in permissions if permission["code"] == "flow.work_item.create")

    role_response = client.post(
        "/api/v1/roles",
        json={
            "name": "RBAC Test Role",
            "description": "Verifies role permission persistence.",
            "scope": "project",
            "is_system": False,
            "is_editable": True,
        },
        headers=admin_headers,
    )
    assert role_response.status_code == 201
    role = role_response.json()

    replace_response = client.put(
        f"/api/v1/roles/{role['id']}/permissions",
        json={"permission_ids": [view_permission["id"], create_permission["id"]]},
        headers=admin_headers,
    )
    assert replace_response.status_code == 200
    assert {mapping["permission_id"] for mapping in replace_response.json()} == {
        view_permission["id"],
        create_permission["id"],
    }

    assignment_response = client.post(
        "/api/v1/role-assignments",
        json={
            "user_id": user["id"],
            "role_id": role["id"],
            "scope_type": "project",
            "scope_id": project["id"],
        },
        headers=admin_headers,
    )
    assert assignment_response.status_code == 201

    scoped_params = {
        "org_id": organization["id"],
        "workspace_id": workspace["id"],
        "project_id": project["id"],
    }
    permissions_response = client.get("/api/v1/me/permissions", params=scoped_params, headers=user_headers)
    assert permissions_response.status_code == 200
    permission_codes = set(permissions_response.json()["permission_codes"])
    assert "flow.work_item.view" in permission_codes
    assert "flow.work_item.create" in permission_codes

    reduced_response = client.put(
        f"/api/v1/roles/{role['id']}/permissions",
        json={"permission_ids": [view_permission["id"]]},
        headers=admin_headers,
    )
    assert reduced_response.status_code == 200
    assert [mapping["permission_id"] for mapping in reduced_response.json()] == [view_permission["id"]]

    role_permissions_response = client.get(f"/api/v1/roles/{role['id']}/permissions", headers=admin_headers)
    assert role_permissions_response.status_code == 200
    assert [mapping["permission_id"] for mapping in role_permissions_response.json()] == [view_permission["id"]]

    updated_permissions_response = client.get("/api/v1/me/permissions", params=scoped_params, headers=user_headers)
    assert updated_permissions_response.status_code == 200
    updated_codes = set(updated_permissions_response.json()["permission_codes"])
    assert "flow.work_item.view" in updated_codes
    assert "flow.work_item.create" not in updated_codes

    context_response = client.get("/api/v1/context/platform", params=scoped_params, headers=user_headers)
    assert context_response.status_code == 200
    context_codes = set(context_response.json()["permissions"])
    assert context_codes == updated_codes
    assert "flow.work_item.view" in context_codes
    assert "flow.work_item.create" not in context_codes
