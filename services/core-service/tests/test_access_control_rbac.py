from tests.conftest import create_auth_headers


def test_permission_catalog_is_seeded_from_permissions_api(client):
    headers = create_auth_headers(client)

    response = client.get("/api/v1/permissions", headers=headers)

    assert response.status_code == 200
    permissions = response.json()
    codes = {permission["code"] for permission in permissions}
    assert "settings.organization.view" in codes
    assert "settings.member.invite" in codes
    assert "flow.workitem.create" in codes
    assert "docs.page.edit" in codes
    assert "desk.ticket.manage" in codes
    flow_permission = next(permission for permission in permissions if permission["code"] == "flow.workitem.create")
    assert flow_permission["module"] == "flow"
    assert flow_permission["scope"] == "project"
    assert flow_permission["status"] == "active"


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
        next(permission for permission in permissions if permission["code"] == "flow.workitem.view"),
        next(permission for permission in permissions if permission["code"] == "flow.workitem.create"),
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
