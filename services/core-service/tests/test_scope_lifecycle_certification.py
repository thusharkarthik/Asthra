from __future__ import annotations

from datetime import datetime, timezone

from app.db.session import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.organization import Organization, OrganizationMember
from app.models.project import Project
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.models.workspace import Workspace
from app.services.role_service import RoleService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _headers(client, email: str, password: str = "password123") -> dict[str, str]:
    return auth_headers(get_auth_token(client, email=email, password=password))


def _user(email: str) -> User:
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).one()
        db.expunge(user)
        return user


def _role(db, key: str) -> Role:
    RoleService(db).ensure_role_catalog()
    role = db.query(Role).filter(Role.key == key, Role.is_active.is_(True)).one()
    return role


def _assign_role(db, *, user: User, role_key: str, scope_type: str, scope_id: int | None, assigned_by: int | None = None) -> RoleAssignment:
    role = _role(db, role_key)
    assignment = RoleAssignment(
        user_id=user.id,
        role_id=role.id,
        scope_type=scope_type,
        scope_id=scope_id,
        status="active",
        assigned_by=assigned_by,
        assigned_at=datetime.now(timezone.utc),
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def _add_org_membership(db, *, user: User, organization_id: int, member_role: str = "member") -> OrganizationMember:
    membership = OrganizationMember(organization_id=organization_id, user_id=user.id, member_role=member_role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def _role_assignment_count() -> int:
    with SessionLocal() as db:
        return db.query(RoleAssignment).count()


def _activity_actions(entity_type: str, entity_id: int) -> list[str]:
    with SessionLocal() as db:
        rows = (
            db.query(ActivityLog)
            .filter(ActivityLog.entity_type == entity_type, ActivityLog.entity_id == str(entity_id))
            .order_by(ActivityLog.id)
            .all()
        )
        return [row.action for row in rows]


def _versions() -> tuple[dict[int, int], dict[int, int], dict[int, int]]:
    with SessionLocal() as db:
        org_versions = {row.id: row.context_version for row in db.query(Organization).all()}
        workspace_versions = {row.id: row.context_version for row in db.query(Workspace).all()}
        project_versions = {row.id: row.context_version for row in db.query(Project).all()}
        return org_versions, workspace_versions, project_versions


def _bootstrap_platform_owner(client) -> dict[str, str]:
    create_test_user(client, email="platform-scope-owner@example.com", password="password123", full_name="Platform Scope Owner")
    return _headers(client, "platform-scope-owner@example.com")


def _create_org_owner(client, *, email: str = "scope-owner@example.com") -> tuple[dict[str, str], dict]:
    _bootstrap_platform_owner(client)
    create_test_user(client, email=email, password="password123", full_name="Scope Owner")
    headers = _headers(client, email)
    response = client.post(
        "/api/v1/organizations/onboard",
        json={"name": "Scope Lifecycle Org", "description": "Lifecycle certification org"},
        headers=headers,
    )
    assert response.status_code == 201
    return headers, response.json()


def _create_workspace(client, headers: dict[str, str], organization_id: int, *, name: str = "Lifecycle Workspace") -> dict:
    response = client.post(
        "/api/v1/workspaces",
        json={"organization_id": organization_id, "name": name, "description": "Lifecycle workspace"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def _create_project(client, headers: dict[str, str], workspace_id: int, *, name: str = "Lifecycle Project") -> dict:
    response = client.post(
        "/api/v1/projects",
        json={"workspace_id": workspace_id, "name": name, "description": "Lifecycle project", "status": "active"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def test_scope_lifecycle_endpoints_require_authentication(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = client.post("/api/v1/organizations", json={"name": "Auth Org"}, headers=platform_headers).json()
    workspace = _create_workspace(client, platform_headers, org["id"], name="Auth Workspace")
    project = _create_project(client, platform_headers, workspace["id"], name="Auth Project")

    requests = [
        ("GET", "/api/v1/organizations", None),
        ("POST", "/api/v1/organizations", {"name": "No Auth Org"}),
        ("GET", f"/api/v1/organizations/{org['id']}", None),
        ("PATCH", f"/api/v1/organizations/{org['id']}", {"name": "Blocked"}),
        ("DELETE", f"/api/v1/organizations/{org['id']}", None),
        ("GET", "/api/v1/workspaces", None),
        ("POST", "/api/v1/workspaces", {"organization_id": org["id"], "name": "No Auth Workspace"}),
        ("GET", f"/api/v1/workspaces/{workspace['id']}", None),
        ("PATCH", f"/api/v1/workspaces/{workspace['id']}", {"name": "Blocked"}),
        ("DELETE", f"/api/v1/workspaces/{workspace['id']}", None),
        ("GET", "/api/v1/projects", None),
        ("POST", "/api/v1/projects", {"workspace_id": workspace["id"], "name": "No Auth Project"}),
        ("GET", f"/api/v1/projects/{project['id']}", None),
        ("PATCH", f"/api/v1/projects/{project['id']}", {"name": "Blocked"}),
        ("DELETE", f"/api/v1/projects/{project['id']}", None),
    ]

    for method, url, payload in requests:
        response = client.request(method, url, json=payload)
        assert response.status_code in {401, 403}


def test_self_serve_organization_lifecycle_assigns_owner_and_preserves_rbac_on_archive_restore(client) -> None:
    headers, org = _create_org_owner(client)
    owner = _user("scope-owner@example.com")

    with SessionLocal() as db:
        owner_role = _role(db, "organization_owner")
        owner_assignment = (
            db.query(RoleAssignment)
            .filter(
                RoleAssignment.user_id == owner.id,
                RoleAssignment.role_id == owner_role.id,
                RoleAssignment.scope_type == "organization",
                RoleAssignment.scope_id == org["id"],
                RoleAssignment.status == "active",
            )
            .one_or_none()
        )
        assert owner_assignment is not None

    before_count = _role_assignment_count()
    before_versions = _versions()[0]

    read_response = client.get(f"/api/v1/organizations/{org['id']}", headers=headers)
    update_response = client.patch(
        f"/api/v1/organizations/{org['id']}",
        json={"name": "Scope Lifecycle Org Updated", "description": "Updated description"},
        headers=headers,
    )
    archive_response = client.patch(f"/api/v1/organizations/{org['id']}", json={"is_active": False}, headers=headers)
    archived_detail = client.get(f"/api/v1/organizations/{org['id']}", headers=headers)
    active_list = client.get("/api/v1/organizations?status=active", headers=headers)
    inactive_list = client.get("/api/v1/organizations?status=inactive", headers=headers)
    restore_response = client.patch(f"/api/v1/organizations/{org['id']}", json={"is_active": True}, headers=headers)

    assert read_response.status_code == 200
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Scope Lifecycle Org Updated"
    assert archive_response.status_code == 200
    assert archive_response.json()["is_active"] is False
    assert archived_detail.status_code == 200
    assert archived_detail.json()["is_active"] is False
    assert org["id"] not in {item["id"] for item in active_list.json()}
    assert org["id"] in {item["id"] for item in inactive_list.json()}
    assert restore_response.status_code == 200
    assert restore_response.json()["is_active"] is True
    assert _role_assignment_count() == before_count

    after_versions = _versions()[0]
    assert after_versions[org["id"]] > before_versions[org["id"]]
    actions = _activity_actions("organization", org["id"])
    assert "organization.created" in actions
    assert "organization.updated" in actions
    assert "organization.deactivated" in actions
    assert "organization.reactivated" in actions


def test_workspace_lifecycle_requires_scope_permission_and_bumps_context_without_rbac_mutation(client) -> None:
    headers, org = _create_org_owner(client, email="workspace-owner@example.com")
    create_response = client.post(
        "/api/v1/workspaces",
        json={"organization_id": org["id"], "name": "Workspace Lifecycle", "description": "Workspace create"},
        headers=headers,
    )
    assert create_response.status_code == 201
    workspace = create_response.json()
    before_count = _role_assignment_count()
    _, before_workspace_versions, _ = _versions()

    read_response = client.get(f"/api/v1/workspaces/{workspace['id']}", headers=headers)
    update_response = client.patch(
        f"/api/v1/workspaces/{workspace['id']}",
        json={"name": "Workspace Lifecycle Updated", "description": "Updated workspace"},
        headers=headers,
    )
    archive_response = client.patch(f"/api/v1/workspaces/{workspace['id']}", json={"is_active": False}, headers=headers)
    archived_detail = client.get(f"/api/v1/workspaces/{workspace['id']}", headers=headers)
    inactive_list = client.get("/api/v1/workspaces?status=inactive", headers=headers)
    restore_response = client.patch(f"/api/v1/workspaces/{workspace['id']}", json={"is_active": True}, headers=headers)

    assert read_response.status_code == 200
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Workspace Lifecycle Updated"
    assert archive_response.status_code == 200
    assert archive_response.json()["is_active"] is False
    assert archived_detail.status_code == 200
    assert archived_detail.json()["is_active"] is False
    assert workspace["id"] in {item["id"] for item in inactive_list.json()}
    assert restore_response.status_code == 200
    assert restore_response.json()["is_active"] is True
    assert _role_assignment_count() == before_count

    _, after_workspace_versions, _ = _versions()
    assert after_workspace_versions[workspace["id"]] > before_workspace_versions[workspace["id"]]
    actions = _activity_actions("workspace", workspace["id"])
    assert "workspace.created" in actions
    assert "workspace.updated" in actions
    assert "workspace.archived" in actions
    assert "workspace.restored" in actions


def test_project_lifecycle_keeps_archived_detail_access_and_restore(client) -> None:
    headers, org = _create_org_owner(client, email="project-owner@example.com")
    workspace = _create_workspace(client, headers, org["id"], name="Project Parent Workspace")
    project = _create_project(client, headers, workspace["id"], name="Project Lifecycle")
    before_count = _role_assignment_count()
    _, _, before_project_versions = _versions()

    update_response = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"name": "Project Lifecycle Updated", "description": "Updated project"},
        headers=headers,
    )
    archive_response = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"status": "archived", "is_active": False},
        headers=headers,
    )
    archived_detail = client.get(f"/api/v1/projects/{project['id']}", headers=headers)
    archived_list = client.get("/api/v1/projects?status=archived", headers=headers)
    active_context = client.get(
        f"/api/v1/context/platform?org_id={org['id']}&workspace_id={workspace['id']}",
        headers=headers,
    )
    restore_response = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"status": "active", "is_active": True},
        headers=headers,
    )

    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Project Lifecycle Updated"
    assert archive_response.status_code == 200
    assert archive_response.json()["is_active"] is False
    assert archive_response.json()["status"] == "archived"
    assert archived_detail.status_code == 200
    assert archived_detail.json()["organization_id"] == org["id"]
    assert project["id"] in {item["id"] for item in archived_list.json()}
    assert active_context.status_code == 200
    assert project["id"] not in {item["id"] for item in active_context.json()["projects"]}
    assert restore_response.status_code == 200
    assert restore_response.json()["is_active"] is True
    assert restore_response.json()["status"] == "active"
    assert _role_assignment_count() == before_count

    _, _, after_project_versions = _versions()
    assert after_project_versions[project["id"]] > before_project_versions[project["id"]]
    actions = _activity_actions("project", project["id"])
    assert "project.created" in actions
    assert "project.updated" in actions
    assert "project.archived" in actions
    assert "project.restored" in actions


def test_unrelated_user_cannot_access_or_mutate_scope_hierarchy(client) -> None:
    owner_headers, org = _create_org_owner(client, email="isolation-owner@example.com")
    workspace = _create_workspace(client, owner_headers, org["id"], name="Isolation Workspace")
    project = _create_project(client, owner_headers, workspace["id"], name="Isolation Project")
    create_test_user(client, email="scope-outsider@example.com", password="password123", full_name="Scope Outsider")
    outsider_headers = _headers(client, "scope-outsider@example.com")

    responses = [
        client.get(f"/api/v1/organizations/{org['id']}", headers=outsider_headers),
        client.patch(f"/api/v1/organizations/{org['id']}", json={"name": "Nope"}, headers=outsider_headers),
        client.get(f"/api/v1/workspaces/{workspace['id']}", headers=outsider_headers),
        client.patch(f"/api/v1/workspaces/{workspace['id']}", json={"name": "Nope"}, headers=outsider_headers),
        client.get(f"/api/v1/projects/{project['id']}", headers=outsider_headers),
        client.patch(f"/api/v1/projects/{project['id']}", json={"name": "Nope"}, headers=outsider_headers),
        client.post("/api/v1/workspaces", json={"organization_id": org["id"], "name": "Nope"}, headers=outsider_headers),
        client.post("/api/v1/projects", json={"workspace_id": workspace["id"], "name": "Nope"}, headers=outsider_headers),
    ]

    assert all(response.status_code == 403 for response in responses)
    assert client.get("/api/v1/organizations", headers=outsider_headers).json() == []
    assert client.get("/api/v1/workspaces", headers=outsider_headers).json() == []
    assert client.get("/api/v1/projects", headers=outsider_headers).json() == []


def test_view_only_org_role_cannot_edit_archive_restore_or_create_children(client) -> None:
    owner_headers, org = _create_org_owner(client, email="auditor-owner@example.com")
    workspace = _create_workspace(client, owner_headers, org["id"], name="Auditor Workspace")
    project = _create_project(client, owner_headers, workspace["id"], name="Auditor Project")
    create_test_user(client, email="org-auditor-scope@example.com", password="password123", full_name="Org Auditor")
    auditor_headers = _headers(client, "org-auditor-scope@example.com")

    with SessionLocal() as db:
        owner = db.query(User).filter(User.email == "auditor-owner@example.com").one()
        auditor = db.query(User).filter(User.email == "org-auditor-scope@example.com").one()
        _add_org_membership(db, user=auditor, organization_id=org["id"], member_role="auditor")
        _assign_role(db, user=auditor, role_key="organization_auditor", scope_type="organization", scope_id=org["id"], assigned_by=owner.id)

    permissions = client.get(f"/api/v1/me/permissions?org_id={org['id']}", headers=auditor_headers)
    assert permissions.status_code == 200
    assert "settings.organization.view" in permissions.json()["permission_codes"]

    denied = [
        client.patch(f"/api/v1/organizations/{org['id']}", json={"name": "Denied"}, headers=auditor_headers),
        client.patch(f"/api/v1/organizations/{org['id']}", json={"is_active": False}, headers=auditor_headers),
        client.post("/api/v1/workspaces", json={"organization_id": org["id"], "name": "Denied"}, headers=auditor_headers),
        client.patch(f"/api/v1/workspaces/{workspace['id']}", json={"name": "Denied"}, headers=auditor_headers),
        client.patch(f"/api/v1/workspaces/{workspace['id']}", json={"is_active": False}, headers=auditor_headers),
        client.post("/api/v1/projects", json={"workspace_id": workspace["id"], "name": "Denied"}, headers=auditor_headers),
        client.patch(f"/api/v1/projects/{project['id']}", json={"name": "Denied"}, headers=auditor_headers),
        client.patch(f"/api/v1/projects/{project['id']}", json={"status": "archived", "is_active": False}, headers=auditor_headers),
    ]

    assert all(response.status_code == 403 for response in denied)


def test_platform_context_reflects_active_hierarchy_and_context_versions_after_lifecycle_mutations(client) -> None:
    headers, org = _create_org_owner(client, email="context-owner@example.com")
    workspace = _create_workspace(client, headers, org["id"], name="Context Workspace")
    project = _create_project(client, headers, workspace["id"], name="Context Project")

    before_version = client.get(
        f"/api/v1/context/version?organization_id={org['id']}&workspace_id={workspace['id']}&project_id={project['id']}",
        headers=headers,
    )
    assert before_version.status_code == 200

    project_archive = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"status": "archived", "is_active": False},
        headers=headers,
    )
    workspace_archive = client.patch(f"/api/v1/workspaces/{workspace['id']}", json={"is_active": False}, headers=headers)
    org_archive = client.patch(f"/api/v1/organizations/{org['id']}", json={"is_active": False}, headers=headers)
    after_version = client.get(
        f"/api/v1/context/version?organization_id={org['id']}&workspace_id={workspace['id']}&project_id={project['id']}",
        headers=headers,
    )
    platform_context = client.get("/api/v1/context/platform", headers=headers)

    assert project_archive.status_code == 200
    assert workspace_archive.status_code == 200
    assert org_archive.status_code == 200
    assert after_version.status_code == 200
    assert after_version.json()["organization_version"] > before_version.json()["organization_version"]
    assert after_version.json()["workspace_version"] > before_version.json()["workspace_version"]
    assert after_version.json()["project_version"] > before_version.json()["project_version"]
    assert platform_context.status_code == 200
    assert org["id"] not in {item["id"] for item in platform_context.json()["organizations"]}
    assert workspace["id"] not in {item["id"] for item in platform_context.json()["workspaces"]}
    assert project["id"] not in {item["id"] for item in platform_context.json()["projects"]}


def test_project_create_rejects_archived_workspace_parent(client) -> None:
    headers, org = _create_org_owner(client, email="archived-parent-owner@example.com")
    workspace = _create_workspace(client, headers, org["id"], name="Archived Parent Workspace")
    archive_workspace = client.patch(f"/api/v1/workspaces/{workspace['id']}", json={"is_active": False}, headers=headers)
    assert archive_workspace.status_code == 200

    response = client.post(
        "/api/v1/projects",
        json={"workspace_id": workspace["id"], "name": "Should Not Exist"},
        headers=headers,
    )

    assert response.status_code == 404
