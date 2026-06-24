from tests.conftest import create_auth_headers, create_test_organization, create_test_workspace


def test_permission_catalog_is_seeded_from_permissions_api(client):
    headers = create_auth_headers(client)

    response = client.get("/api/v1/permissions", headers=headers)

    assert response.status_code == 200
    permissions = response.json()
    codes = {permission["code"] for permission in permissions}
    assert "settings.organization.view" in codes
    assert "settings.member.invite" in codes
    assert "settings.member.view" in codes
    assert "settings.role.manage" in codes
    assert "flow.work_item.create" in codes
    assert "flow.board.view" in codes
    assert "automation.rule.manage" in codes
    assert "media.asset.manage" in codes
    assert "docs.page.edit" in codes
    assert "desk.ticket.manage" in codes
    assert len(codes) >= 40
    flow_permission = next(permission for permission in permissions if permission["code"] == "flow.work_item.create")
    assert flow_permission["module"] == "flow"
    assert flow_permission["scope"] == "project"
    assert flow_permission["status"] == "active"


def test_effective_access_debug_endpoint_returns_action_results(client):
    headers = create_auth_headers(client)
    me = client.get("/api/v1/users/me", headers=headers).json()
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])
    project_response = client.post(
        "/api/v1/projects",
        json={"workspace_id": workspace["id"], "name": "Certification Project", "status": "active"},
        headers=headers,
    )
    assert project_response.status_code == 201
    project = project_response.json()

    response = client.get(
        "/api/v1/access-control/debug/effective-access",
        params=[
            ("user_id", me["id"]),
            ("scope_type", "project"),
            ("scope_id", project["id"]),
            ("action_keys", "settings.project.restore"),
            ("action_keys", "settings.project.archive"),
        ],
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["id"] == me["id"]
    assert any(role["key"] == "organization_owner" for role in payload["inherited_roles"])
    restore = next(result for result in payload["action_results"] if result["action_key"] == "settings.project.restore")
    assert restore["allowed"] is True
    assert restore["source_role"] == "Organization Owner"


def test_create_permission_catalog_record(client):
    headers = create_auth_headers(client)

    response = client.post(
        "/api/v1/permissions",
        json={
            "code": "automation.workflow.view",
            "name": "View automation workflows",
            "description": "View automation workflow definitions.",
            "module": "automation",
            "scope": "workspace",
            "status": "active",
        },
        headers=headers,
    )

    assert response.status_code == 201
    permission = response.json()
    assert permission["code"] == "automation.workflow.view"
    assert permission["module"] == "automation"
    assert permission["scope"] == "workspace"
    assert permission["status"] == "active"


def test_role_create_update_and_permission_mapping(client):
    headers = create_auth_headers(client)
    permissions = client.get("/api/v1/permissions", headers=headers).json()
    selected_permissions = [
        next(permission for permission in permissions if permission["code"] == "flow.work_item.view"),
        next(permission for permission in permissions if permission["code"] == "flow.work_item.create"),
    ]

    role_response = client.post(
        "/api/v1/roles",
        json={
            "name": "Delivery Contributor",
            "description": "Can contribute delivery work.",
            "scope": "project",
            "is_system": False,
            "is_editable": True,
        },
        headers=headers,
    )
    assert role_response.status_code == 201
    role = role_response.json()
    assert role["scope"] == "project"
    assert role["is_system"] is False
    assert role["is_editable"] is True

    update_response = client.put(
        f"/api/v1/roles/{role['id']}",
        json={"name": "Delivery Manager", "description": "Manages delivery work.", "scope": "project"},
        headers=headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Delivery Manager"

    mapping_response = client.put(
        f"/api/v1/roles/{role['id']}/permissions",
        json={"permission_ids": [permission["id"] for permission in selected_permissions]},
        headers=headers,
    )
    assert mapping_response.status_code == 200
    mappings = mapping_response.json()
    assert {mapping["permission_id"] for mapping in mappings} == {permission["id"] for permission in selected_permissions}

    reduced_response = client.put(
        f"/api/v1/roles/{role['id']}/permissions",
        json={"permission_ids": [selected_permissions[0]["id"]]},
        headers=headers,
    )
    assert reduced_response.status_code == 200
    assert [mapping["permission_id"] for mapping in reduced_response.json()] == [selected_permissions[0]["id"]]


def test_user_permissions_are_not_assigned_directly(client):
    headers = create_auth_headers(client)

    response = client.post(
        "/api/v1/users/1/permissions",
        json={"permission_id": 1},
        headers=headers,
    )

    assert response.status_code == 404


def test_role_templates_api_lists_enterprise_templates(client):
    headers = create_auth_headers(client)

    response = client.get("/api/v1/role-templates", headers=headers)

    assert response.status_code == 200
    templates = response.json()
    keys = {template["key"] for template in templates}
    assert "platform_owner" in keys
    assert "organization_auditor" in keys
    assert "workspace_admin" in keys
    assert "project_manager" in keys
    assert "team_lead" in keys
    assert "knowledge_manager" in keys
    project_manager = next(template for template in templates if template["key"] == "project_manager")
    assert project_manager["is_system"] is True
    assert project_manager["is_editable"] is False
    assert "flow.work_item.*" in project_manager["permission_patterns"]


def test_system_role_templates_are_seeded_and_locked(client):
    headers = create_auth_headers(client)

    roles_response = client.get("/api/v1/roles", headers=headers)

    assert roles_response.status_code == 200
    roles = roles_response.json()
    project_manager = next(role for role in roles if role["key"] == "project_manager")
    assert project_manager["is_system"] is True
    assert project_manager["is_editable"] is False

    update_response = client.put(
        f"/api/v1/roles/{project_manager['id']}",
        json={"name": "Changed Project Manager"},
        headers=headers,
    )
    assert update_response.status_code == 400

    replace_response = client.put(
        f"/api/v1/roles/{project_manager['id']}/permissions",
        json={"permission_ids": []},
        headers=headers,
    )
    assert replace_response.status_code == 400


def test_role_template_permissions_are_mapped(client):
    headers = create_auth_headers(client)
    roles = client.get("/api/v1/roles", headers=headers).json()
    permissions = client.get("/api/v1/permissions", headers=headers).json()
    permission_codes_by_id = {permission["id"]: permission["code"] for permission in permissions}

    platform_owner = next(role for role in roles if role["key"] == "platform_owner")
    platform_owner_mappings = client.get(f"/api/v1/roles/{platform_owner['id']}/permissions", headers=headers).json()
    assert {mapping["permission_id"] for mapping in platform_owner_mappings} == set(permission_codes_by_id)

    project_manager = next(role for role in roles if role["key"] == "project_manager")
    project_manager_mappings = client.get(f"/api/v1/roles/{project_manager['id']}/permissions", headers=headers).json()
    project_manager_codes = {permission_codes_by_id[mapping["permission_id"]] for mapping in project_manager_mappings}
    assert "flow.work_item.create" in project_manager_codes
    assert "flow.sprint.manage" in project_manager_codes
    assert "flow.release.manage" in project_manager_codes
    assert "flow.report.view" in project_manager_codes
    assert "settings.organization.manage" not in project_manager_codes

    project_viewer = next(role for role in roles if role["key"] == "project_viewer")
    project_viewer_mappings = client.get(f"/api/v1/roles/{project_viewer['id']}/permissions", headers=headers).json()
    project_viewer_codes = {permission_codes_by_id[mapping["permission_id"]] for mapping in project_viewer_mappings}
    assert "flow.work_item.view" in project_viewer_codes
    assert "flow.board.view" in project_viewer_codes
    assert "flow.sprint.view" in project_viewer_codes
    assert "flow.release.view" in project_viewer_codes
    assert all(code.endswith(".view") for code in project_viewer_codes)
