from __future__ import annotations

from datetime import datetime, timezone

from app.db.session import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.organization import OrganizationMember
from app.models.permission import Permission
from app.models.project import ProjectMembership
from app.models.role import Role, RolePermission
from app.models.user import RoleAssignment, User
from app.models.workspace import WorkspaceMember
from app.services.access_control_service import AccessControlService
from app.services.role_service import RoleService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _headers(client, email: str, password: str = "password123") -> dict[str, str]:
    return auth_headers(get_auth_token(client, email=email, password=password))


def _bootstrap_platform_owner(client, *, email: str = "member-role-platform@example.com") -> dict[str, str]:
    create_test_user(client, email=email, password="password123", full_name="Member Role Platform")
    return _headers(client, email)


def _create_user(client, email: str, *, full_name: str | None = None) -> User:
    create_test_user(client, email=email, password="password123", full_name=full_name or email.split("@")[0].title())
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).one()
        db.expunge(user)
        return user


def _user(db, email: str) -> User:
    return db.query(User).filter(User.email == email).one()


def _role(db, key: str) -> Role:
    RoleService(db).ensure_role_catalog()
    return db.query(Role).filter(Role.key == key, Role.is_active.is_(True)).one()


def _create_org(client, headers: dict[str, str], name: str) -> dict:
    response = client.post("/api/v1/organizations", json={"name": name, "description": "Member lifecycle org"}, headers=headers)
    assert response.status_code == 201
    return response.json()


def _create_workspace(client, headers: dict[str, str], organization_id: int, name: str = "Member Lifecycle Workspace") -> dict:
    response = client.post(
        "/api/v1/workspaces",
        json={"organization_id": organization_id, "name": name, "description": "Member lifecycle workspace"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def _create_project(client, headers: dict[str, str], workspace_id: int, name: str = "Member Lifecycle Project") -> dict:
    response = client.post(
        "/api/v1/projects",
        json={"workspace_id": workspace_id, "name": name, "description": "Member lifecycle project", "status": "active"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def _assign_role_direct(
    db,
    *,
    user: User,
    role_key: str,
    scope_type: str,
    scope_id: int | None,
    assigned_by: int | None = None,
) -> RoleAssignment:
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


def _active_assignment_count(db, user_id: int, scope_type: str | None = None, scope_id: int | None = None) -> int:
    query = db.query(RoleAssignment).filter(RoleAssignment.user_id == user_id, RoleAssignment.status == "active")
    if scope_type is not None:
        query = query.filter(RoleAssignment.scope_type == scope_type)
    if scope_id is not None:
        query = query.filter(RoleAssignment.scope_id == scope_id)
    return query.count()


def _permission_codes(db, user_id: int, scope_type: str, scope_id: int | None) -> set[str]:
    return set(AccessControlService(db).get_user_permissions(user_id, scope_type, scope_id)["permission_codes"])


def _create_custom_role(db, *, role_key: str, permission_code: str, organization_scope: str = "organization") -> Role:
    role = Role(name=role_key.replace("_", " ").title(), key=role_key, scope=organization_scope, is_system=False, is_editable=True, is_active=True)
    permission = Permission(
        key=permission_code,
        code=permission_code,
        name=permission_code.replace(".", " ").title(),
        description=f"Certification permission {permission_code}",
        module=permission_code.split(".")[0],
        resource=permission_code.split(".")[1],
        action=permission_code.split(".")[2],
        scope=organization_scope,
        risk_level="low",
        status="active",
        source="custom",
        is_system=False,
        is_active=True,
    )
    db.add_all([role, permission])
    db.commit()
    db.refresh(role)
    db.refresh(permission)
    db.add(RolePermission(role_id=role.id, permission_id=permission.id))
    db.commit()
    return role


def test_member_and_role_assignment_operations_require_authentication(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Member Auth Org")
    target = _create_user(client, "member-auth-target@example.com")

    with SessionLocal() as db:
        target_user = db.get(User, target.id)
        assert target_user is not None
        assignment = _assign_role_direct(
            db,
            user=target_user,
            role_key="organization_member",
            scope_type="organization",
            scope_id=org["id"],
            assigned_by=target.id,
        )
        assignment_id = assignment.id

    requests = [
        ("GET", f"/api/v1/organizations/{org['id']}/members", None),
        ("DELETE", f"/api/v1/organizations/{org['id']}/members/{target.id}", None),
        ("GET", "/api/v1/role-assignments", None),
        ("POST", "/api/v1/role-assignments", {"user_id": target.id, "role_id": 1, "scope_type": "organization", "scope_id": org["id"]}),
        ("DELETE", f"/api/v1/role-assignments/{assignment_id}", None),
        ("POST", "/api/v1/invitations", {"email": "no-auth-invite@example.com", "organization_id": org["id"]}),
    ]

    for method, url, payload in requests:
        response = client.request(method, url, json=payload)
        assert response.status_code in {401, 403}


def test_role_assignment_list_is_scoped_and_member_without_manage_cannot_mutate(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org_a = _create_org(client, platform_headers, "Role Assignment Org A")
    org_b = _create_org(client, platform_headers, "Role Assignment Org B")
    _create_user(client, "assignment-admin@example.com")
    _create_user(client, "assignment-member@example.com")
    _create_user(client, "assignment-other@example.com")
    admin_headers = _headers(client, "assignment-admin@example.com")
    member_headers = _headers(client, "assignment-member@example.com")

    with SessionLocal() as db:
        platform = _user(db, "member-role-platform@example.com")
        admin = _user(db, "assignment-admin@example.com")
        member = _user(db, "assignment-member@example.com")
        other = _user(db, "assignment-other@example.com")
        _assign_role_direct(db, user=admin, role_key="organization_admin", scope_type="organization", scope_id=org_a["id"], assigned_by=platform.id)
        member_assignment = _assign_role_direct(db, user=member, role_key="organization_member", scope_type="organization", scope_id=org_a["id"], assigned_by=platform.id)
        hidden_assignment = _assign_role_direct(db, user=other, role_key="organization_admin", scope_type="organization", scope_id=org_b["id"], assigned_by=platform.id)

    scoped_list = client.get("/api/v1/role-assignments", headers=admin_headers)
    member_list = client.get("/api/v1/role-assignments", headers=member_headers)
    forbidden_assign = client.post(
        "/api/v1/role-assignments",
        json={"user_id": other.id, "role_id": member_assignment.role_id, "scope_type": "organization", "scope_id": org_a["id"]},
        headers=member_headers,
    )
    forbidden_delete = client.delete(f"/api/v1/role-assignments/{member_assignment.id}", headers=member_headers)

    assert scoped_list.status_code == 200
    visible_ids = {item["id"] for item in scoped_list.json()}
    assert member_assignment.id in visible_ids
    assert hidden_assignment.id not in visible_ids
    assert member_list.status_code == 200
    assert {item["id"] for item in member_list.json()} == {member_assignment.id}
    assert forbidden_assign.status_code == 403
    assert forbidden_delete.status_code == 403


def test_existing_user_org_invite_creates_membership_role_assignment_and_reinvite_after_removal(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Lifecycle Org")
    invited = _create_user(client, "invite-lifecycle-target@example.com")

    with SessionLocal() as db:
        org_member_role = _role(db, "organization_member")
        role_id = org_member_role.id

    invite = client.post(
        "/api/v1/invitations",
        json={"email": "invite-lifecycle-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    )
    duplicate = client.post(
        "/api/v1/invitations",
        json={"email": "invite-lifecycle-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    )

    assert invite.status_code == 201
    assert invite.json()["status"] == "accepted"
    assert duplicate.status_code == 409

    with SessionLocal() as db:
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=invited.id).one_or_none() is not None
        assert _active_assignment_count(db, invited.id, "organization", org["id"]) == 1

    remove = client.delete(f"/api/v1/organizations/{org['id']}/members/{invited.id}", headers=platform_headers)
    reinvite = client.post(
        "/api/v1/invitations",
        json={"email": "invite-lifecycle-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    )

    assert remove.status_code == 204
    assert reinvite.status_code == 201
    assert reinvite.json()["status"] == "accepted"
    with SessionLocal() as db:
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=invited.id).one_or_none() is not None
        assert _active_assignment_count(db, invited.id, "organization", org["id"]) == 1


def test_multiple_role_union_and_last_role_removal_remove_scoped_access_without_fallback(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Union Lifecycle Org")
    target = _create_user(client, "union-lifecycle-target@example.com")

    with SessionLocal() as db:
        alpha = _create_custom_role(db, role_key="cert_alpha", permission_code="cert.alpha.view")
        beta = _create_custom_role(db, role_key="cert_beta", permission_code="cert.beta.view")
        alpha_id = alpha.id
        beta_id = beta.id
        target_user = db.get(User, target.id)
        assert target_user is not None

    first = client.post(
        "/api/v1/role-assignments",
        json={"user_id": target.id, "role_id": alpha_id, "scope_type": "organization", "scope_id": org["id"]},
        headers=platform_headers,
    )
    second = client.post(
        "/api/v1/role-assignments",
        json={"user_id": target.id, "role_id": beta_id, "scope_type": "organization", "scope_id": org["id"]},
        headers=platform_headers,
    )
    duplicate = client.post(
        "/api/v1/role-assignments",
        json={"user_id": target.id, "role_id": beta_id, "scope_type": "organization", "scope_id": org["id"]},
        headers=platform_headers,
    )

    assert first.status_code == 201
    assert second.status_code == 201
    assert duplicate.status_code == 409
    with SessionLocal() as db:
        assert _permission_codes(db, target.id, "organization", org["id"]) >= {"cert.alpha.view", "cert.beta.view"}
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=target.id).one_or_none() is not None

    remove_first = client.delete(f"/api/v1/role-assignments/{first.json()['id']}", headers=platform_headers)
    assert remove_first.status_code == 204
    with SessionLocal() as db:
        permissions = _permission_codes(db, target.id, "organization", org["id"])
        assert "cert.alpha.view" not in permissions
        assert "cert.beta.view" in permissions
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=target.id).one_or_none() is not None

    remove_second = client.delete(f"/api/v1/role-assignments/{second.json()['id']}", headers=platform_headers)
    assert remove_second.status_code == 204
    with SessionLocal() as db:
        permissions = _permission_codes(db, target.id, "organization", org["id"])
        assert "cert.alpha.view" not in permissions
        assert "cert.beta.view" not in permissions
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=target.id).one_or_none() is None
        assert _active_assignment_count(db, target.id, "organization", org["id"]) == 0


def test_workspace_member_removal_revokes_descendant_project_access_but_preserves_org_access(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Workspace Removal Org")
    workspace = _create_workspace(client, platform_headers, org["id"])
    project = _create_project(client, platform_headers, workspace["id"])
    target = _create_user(client, "workspace-removal-target@example.com")

    with SessionLocal() as db:
        platform = _user(db, "member-role-platform@example.com")
        target_user = db.get(User, target.id)
        assert target_user is not None
        _assign_role_direct(db, user=target_user, role_key="organization_member", scope_type="organization", scope_id=org["id"], assigned_by=platform.id)
        db.add(OrganizationMember(organization_id=org["id"], user_id=target.id, member_role="member"))
        workspace_assignment = _assign_role_direct(db, user=target_user, role_key="workspace_admin", scope_type="workspace", scope_id=workspace["id"], assigned_by=platform.id)
        project_assignment = _assign_role_direct(db, user=target_user, role_key="project_contributor", scope_type="project", scope_id=project["id"], assigned_by=platform.id)
        db.add(WorkspaceMember(workspace_id=workspace["id"], user_id=target.id, role_id=workspace_assignment.role_id, member_role="workspace_admin"))
        db.add(ProjectMembership(project_id=project["id"], user_id=target.id, role_id=project_assignment.role_id, status="active"))
        db.commit()

    response = client.delete(f"/api/v1/workspaces/{workspace['id']}/members/{target.id}", headers=platform_headers)

    assert response.status_code == 204
    with SessionLocal() as db:
        assert db.query(WorkspaceMember).filter_by(workspace_id=workspace["id"], user_id=target.id).one_or_none() is None
        project_membership = db.query(ProjectMembership).filter_by(project_id=project["id"], user_id=target.id).one_or_none()
        assert project_membership is not None
        assert project_membership.status == "inactive"
        assert _active_assignment_count(db, target.id, "organization", org["id"]) == 1
        assert _active_assignment_count(db, target.id, "workspace", workspace["id"]) == 0
        assert _active_assignment_count(db, target.id, "project", project["id"]) == 0
        assert "settings.organization.view" in _permission_codes(db, target.id, "organization", org["id"])
        assert "settings.project.edit" not in _permission_codes(db, target.id, "project", project["id"])


def test_organization_member_removal_revokes_descendant_workspace_and_project_assignments(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Org Removal Cascade")
    other_org = _create_org(client, platform_headers, "Unrelated Org")
    workspace = _create_workspace(client, platform_headers, org["id"], name="Org Removal Workspace")
    other_workspace = _create_workspace(client, platform_headers, other_org["id"], name="Unrelated Workspace")
    project = _create_project(client, platform_headers, workspace["id"], name="Org Removal Project")
    target = _create_user(client, "org-removal-target@example.com")

    with SessionLocal() as db:
        platform = _user(db, "member-role-platform@example.com")
        target_user = db.get(User, target.id)
        assert target_user is not None
        _assign_role_direct(db, user=target_user, role_key="organization_admin", scope_type="organization", scope_id=org["id"], assigned_by=platform.id)
        _assign_role_direct(db, user=target_user, role_key="workspace_admin", scope_type="workspace", scope_id=workspace["id"], assigned_by=platform.id)
        _assign_role_direct(db, user=target_user, role_key="project_contributor", scope_type="project", scope_id=project["id"], assigned_by=platform.id)
        unrelated_assignment = _assign_role_direct(db, user=target_user, role_key="workspace_viewer", scope_type="workspace", scope_id=other_workspace["id"], assigned_by=platform.id)
        db.add(OrganizationMember(organization_id=org["id"], user_id=target.id, member_role="member"))
        db.add(WorkspaceMember(workspace_id=workspace["id"], user_id=target.id, member_role="member"))
        db.add(WorkspaceMember(workspace_id=other_workspace["id"], user_id=target.id, member_role="viewer"))
        db.add(ProjectMembership(project_id=project["id"], user_id=target.id, status="active"))
        db.commit()
        unrelated_assignment_id = unrelated_assignment.id

    response = client.delete(f"/api/v1/organizations/{org['id']}/members/{target.id}", headers=platform_headers)

    assert response.status_code == 204
    with SessionLocal() as db:
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=target.id).one_or_none() is None
        assert db.query(WorkspaceMember).filter_by(workspace_id=workspace["id"], user_id=target.id).one_or_none() is None
        assert _active_assignment_count(db, target.id, "organization", org["id"]) == 0
        assert _active_assignment_count(db, target.id, "workspace", workspace["id"]) == 0
        assert _active_assignment_count(db, target.id, "project", project["id"]) == 0
        unrelated = db.get(RoleAssignment, unrelated_assignment_id)
        assert unrelated is not None
        assert unrelated.status == "active"


def test_platform_role_assignment_safety_and_superuser_self_removal_guard(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Platform Safety Org")
    _create_user(client, "platform-safety-owner@example.com")
    target = _create_user(client, "platform-safety-target@example.com")
    owner_headers = _headers(client, "platform-safety-owner@example.com")

    with SessionLocal() as db:
        platform = _user(db, "member-role-platform@example.com")
        org_owner = _user(db, "platform-safety-owner@example.com")
        _assign_role_direct(db, user=org_owner, role_key="organization_owner", scope_type="organization", scope_id=org["id"], assigned_by=platform.id)
        platform_owner = _role(db, "platform_owner")
        superuser = _role(db, "superuser")
        platform_owner_id = platform_owner.id
        superuser_id = superuser.id
        self_assignment = (
            db.query(RoleAssignment)
            .filter(RoleAssignment.user_id == platform.id, RoleAssignment.scope_type == "platform", RoleAssignment.status == "active")
            .first()
        )
        assert self_assignment is not None

    platform_role_attempt = client.post(
        "/api/v1/role-assignments",
        json={"user_id": target.id, "role_id": platform_owner_id, "scope_type": "platform", "scope_id": None},
        headers=owner_headers,
    )
    hidden_role_attempt = client.post(
        "/api/v1/role-assignments",
        json={"user_id": target.id, "role_id": superuser_id, "scope_type": "platform", "scope_id": None},
        headers=owner_headers,
    )
    self_delete = client.delete(f"/api/v1/role-assignments/{self_assignment.id}", headers=platform_headers)

    assert platform_role_attempt.status_code == 403
    assert hidden_role_attempt.status_code in {403, 404}
    assert self_delete.status_code == 400


def test_role_assignment_changes_update_effective_permissions_and_access_version_without_read_mutations(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Version Role Org")
    target = _create_user(client, "version-role-target@example.com")

    with SessionLocal() as db:
        role_id = _role(db, "organization_admin").id
        before_count = db.query(RoleAssignment).count()

    version_before = client.get(f"/api/v1/context/version?organization_id={org['id']}", headers=platform_headers)
    assert version_before.status_code == 200
    before_access_version = version_before.json()["access_version"]

    assigned = client.post(
        "/api/v1/role-assignments",
        json={"user_id": target.id, "role_id": role_id, "scope_type": "organization", "scope_id": org["id"]},
        headers=platform_headers,
    )
    assert assigned.status_code == 201

    version_after_assign = client.get(f"/api/v1/context/version?organization_id={org['id']}", headers=platform_headers)
    permissions_after_assign = client.get(
        f"/api/v1/users/{target.id}/effective-permissions?scope_type=organization&scope_id={org['id']}",
        headers=platform_headers,
    )
    read_assignments = client.get("/api/v1/role-assignments", headers=platform_headers)

    assert version_after_assign.status_code == 200
    assert version_after_assign.json()["access_version"] > before_access_version
    assert permissions_after_assign.status_code == 200
    assert "settings.organization.manage" in permissions_after_assign.json()["permission_codes"]
    assert read_assignments.status_code == 200

    with SessionLocal() as db:
        after_read_count = db.query(RoleAssignment).count()
        assert after_read_count == before_count + 1

    removed = client.delete(f"/api/v1/role-assignments/{assigned.json()['id']}", headers=platform_headers)
    assert removed.status_code == 204
    version_after_remove = client.get(f"/api/v1/context/version?organization_id={org['id']}", headers=platform_headers)
    assert version_after_remove.status_code == 200
    assert version_after_remove.json()["access_version"] > version_after_assign.json()["access_version"]

    with SessionLocal() as db:
        assert _active_assignment_count(db, target.id, "organization", org["id"]) == 0
        assert db.query(ActivityLog).filter(ActivityLog.action.in_(["role.assigned", "role.revoked"])).count() >= 2
