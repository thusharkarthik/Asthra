from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.db.session import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.invitation import Invitation
from app.models.notification import Notification
from app.models.organization import OrganizationMember
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.models.workspace import WorkspaceMember
from app.services.access_control_service import AccessControlService
from app.services.role_service import RoleService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _headers(client, email: str, password: str = "password123") -> dict[str, str]:
    return auth_headers(get_auth_token(client, email=email, password=password))


def _bootstrap_platform_owner(client, *, email: str = "invite-platform@example.com") -> dict[str, str]:
    create_test_user(client, email=email, password="password123", full_name="Invite Platform")
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


def _assign_role_direct(
    db,
    *,
    user: User,
    role_key: str,
    scope_type: str,
    scope_id: int | None,
    assigned_by: int | None = None,
) -> RoleAssignment:
    assignment = RoleAssignment(
        user_id=user.id,
        role_id=_role(db, role_key).id,
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


def _create_org(client, headers: dict[str, str], name: str) -> dict:
    response = client.post("/api/v1/organizations", json={"name": name, "description": "Invitation cert org"}, headers=headers)
    assert response.status_code == 201
    return response.json()


def _create_workspace(client, headers: dict[str, str], organization_id: int, name: str = "Invitation Cert Workspace") -> dict:
    response = client.post(
        "/api/v1/workspaces",
        json={"organization_id": organization_id, "name": name, "description": "Invitation cert workspace"},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def _active_assignments(db, user_id: int, scope_type: str | None = None, scope_id: int | None = None) -> list[RoleAssignment]:
    query = db.query(RoleAssignment).filter(RoleAssignment.user_id == user_id, RoleAssignment.status == "active")
    if scope_type is not None:
        query = query.filter(RoleAssignment.scope_type == scope_type)
    if scope_id is not None:
        query = query.filter(RoleAssignment.scope_id == scope_id)
    return list(query.all())


def _permission_codes(db, user_id: int, scope_type: str, scope_id: int | None) -> set[str]:
    return set(AccessControlService(db).get_user_permissions(user_id, scope_type, scope_id)["permission_codes"])


def test_invitation_endpoints_require_authentication(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Auth Org")
    invitation = client.post(
        "/api/v1/invitations",
        json={"email": "invite-auth-pending@example.com", "organization_id": org["id"]},
        headers=platform_headers,
    ).json()

    requests = [
        ("GET", "/api/v1/invitations", None),
        ("GET", f"/api/v1/invitations/{invitation['id']}", None),
        ("POST", "/api/v1/invitations", {"email": "no-auth-invite@example.com", "organization_id": org["id"]}),
        ("POST", f"/api/v1/invitations/{invitation['id']}/accept", {"token": invitation["token"]}),
        ("POST", f"/api/v1/invitations/{invitation['id']}/accept-in-app", None),
        ("POST", f"/api/v1/invitations/{invitation['id']}/decline-in-app", None),
        ("POST", f"/api/v1/invitations/{invitation['id']}/resend", None),
        ("POST", f"/api/v1/invitations/{invitation['id']}/revoke", None),
    ]

    for method, url, payload in requests:
        response = client.request(method, url, json=payload)
        assert response.status_code in {401, 403}


def test_invite_requires_permission_and_cannot_target_unrelated_scope(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org_a = _create_org(client, platform_headers, "Invite Permission Org A")
    org_b = _create_org(client, platform_headers, "Invite Permission Org B")
    workspace_b = _create_workspace(client, platform_headers, org_b["id"], name="Invite Permission Workspace B")
    _create_user(client, "invite-no-permission@example.com")
    _create_user(client, "invite-org-admin@example.com")
    no_permission_headers = _headers(client, "invite-no-permission@example.com")
    org_admin_headers = _headers(client, "invite-org-admin@example.com")

    with SessionLocal() as db:
        platform = _user(db, "invite-platform@example.com")
        no_permission = _user(db, "invite-no-permission@example.com")
        org_admin = _user(db, "invite-org-admin@example.com")
        _assign_role_direct(db, user=no_permission, role_key="organization_member", scope_type="organization", scope_id=org_a["id"], assigned_by=platform.id)
        _assign_role_direct(db, user=org_admin, role_key="organization_admin", scope_type="organization", scope_id=org_a["id"], assigned_by=platform.id)
        db.add(OrganizationMember(organization_id=org_a["id"], user_id=no_permission.id, member_role="member"))
        db.add(OrganizationMember(organization_id=org_a["id"], user_id=org_admin.id, member_role="admin"))
        db.commit()

    denied_same_org = client.post(
        "/api/v1/invitations",
        json={"email": "denied-same-org@example.com", "organization_id": org_a["id"]},
        headers=no_permission_headers,
    )
    denied_unrelated_org = client.post(
        "/api/v1/invitations",
        json={"email": "denied-unrelated-org@example.com", "organization_id": org_b["id"]},
        headers=org_admin_headers,
    )
    denied_unrelated_workspace = client.post(
        "/api/v1/invitations",
        json={"email": "denied-unrelated-workspace@example.com", "organization_id": org_b["id"], "workspace_id": workspace_b["id"]},
        headers=org_admin_headers,
    )

    assert denied_same_org.status_code == 403
    assert denied_unrelated_org.status_code in {403, 404}
    assert denied_unrelated_workspace.status_code in {403, 404}


def test_existing_user_org_invite_creates_org_membership_assignment_notification_and_activity(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Existing Org")
    invited = _create_user(client, "invite-existing-org-target@example.com")

    with SessionLocal() as db:
        role_id = _role(db, "organization_member").id
        assignment_count_before = db.query(RoleAssignment).count()

    response = client.post(
        "/api/v1/invitations",
        json={"email": "invite-existing-org-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "accepted"
    assert payload["scope_type"] == "organization"
    assert payload["scope_id"] == org["id"]
    assert payload["token"]

    with SessionLocal() as db:
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=invited.id).one_or_none() is not None
        scoped_assignments = _active_assignments(db, invited.id, "organization", org["id"])
        assert len(scoped_assignments) == 1
        assert scoped_assignments[0].role_id == role_id
        assert _active_assignments(db, invited.id, "workspace") == []
        assert db.query(RoleAssignment).count() == assignment_count_before + 1
        assert db.query(Notification).filter_by(user_id=invited.id, type="invitation.accepted", entity_type="invitation").count() == 1
        assert db.query(ActivityLog).filter_by(action="member.invited", entity_type="invitation", entity_id=str(payload["id"])).count() == 1


def test_existing_user_invite_reactivates_stale_role_assignment_without_500(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Stale Assignment Org")
    invited = _create_user(client, "invite-stale-assignment-target@example.com")

    with SessionLocal() as db:
        platform = _user(db, "invite-platform@example.com")
        role_id = _role(db, "organization_member").id
        stale_assignment = RoleAssignment(
            user_id=invited.id,
            role_id=role_id,
            scope_type="organization",
            scope_id=org["id"],
            status="inactive",
            assigned_by=platform.id,
            assigned_at=datetime.now(timezone.utc) - timedelta(days=2),
            revoked_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db.add(stale_assignment)
        db.commit()
        assignment_count_before = db.query(RoleAssignment).count()
        stale_assignment_id = stale_assignment.id

    response = client.post(
        "/api/v1/invitations",
        json={"email": "invite-stale-assignment-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    )

    assert response.status_code == 201
    assert response.json()["status"] == "accepted"

    with SessionLocal() as db:
        assignment = db.get(RoleAssignment, stale_assignment_id)
        assert assignment is not None
        assert assignment.status == "active"
        assert assignment.revoked_at is None
        assert db.query(RoleAssignment).count() == assignment_count_before
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=invited.id).one_or_none() is not None


def test_existing_user_workspace_invite_creates_workspace_access_and_parent_org_membership(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Workspace Org")
    workspace = _create_workspace(client, platform_headers, org["id"])
    invited = _create_user(client, "invite-existing-workspace-target@example.com")

    with SessionLocal() as db:
        workspace_role_id = _role(db, "workspace_member").id

    response = client.post(
        "/api/v1/invitations",
        json={
            "email": "invite-existing-workspace-target@example.com",
            "organization_id": org["id"],
            "workspace_id": workspace["id"],
            "role_id": workspace_role_id,
        },
        headers=platform_headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "accepted"
    assert payload["scope_type"] == "workspace"
    assert payload["scope_id"] == workspace["id"]

    with SessionLocal() as db:
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=invited.id).one_or_none() is not None
        assert db.query(WorkspaceMember).filter_by(workspace_id=workspace["id"], user_id=invited.id).one_or_none() is not None
        workspace_assignments = _active_assignments(db, invited.id, "workspace", workspace["id"])
        org_assignments = _active_assignments(db, invited.id, "organization", org["id"])
        assert len(workspace_assignments) == 1
        assert workspace_assignments[0].role_id == workspace_role_id
        assert len(org_assignments) == 1
        assert db.get(Role, org_assignments[0].role_id).key == "organization_member"
        assert "settings.workspace.view" in _permission_codes(db, invited.id, "workspace", workspace["id"])


def test_pending_invite_duplicate_resend_cancel_and_cancelled_invite_cannot_be_used(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Status Org")
    with SessionLocal() as db:
        role_id = _role(db, "organization_member").id

    create = client.post(
        "/api/v1/invitations",
        json={"email": "invite-status-pending@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    )
    duplicate = client.post(
        "/api/v1/invitations",
        json={"email": "invite-status-pending@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    )

    assert create.status_code == 201
    assert create.json()["status"] == "pending"
    assert duplicate.status_code == 409
    original_token = create.json()["token"]

    resend = client.post(f"/api/v1/invitations/{create.json()['id']}/resend", headers=platform_headers)
    assert resend.status_code == 200
    assert resend.json()["status"] == "pending"
    assert resend.json()["token"] != original_token

    cancel = client.post(f"/api/v1/invitations/{create.json()['id']}/revoke", headers=platform_headers)
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"

    _create_user(client, "invite-status-pending@example.com")
    target_headers = _headers(client, "invite-status-pending@example.com")
    accept_cancelled = client.post(
        f"/api/v1/invitations/{create.json()['id']}/accept",
        json={"token": resend.json()["token"]},
        headers=target_headers,
    )
    resend_cancelled = client.post(f"/api/v1/invitations/{create.json()['id']}/resend", headers=platform_headers)

    assert accept_cancelled.status_code == 400
    assert resend_cancelled.status_code == 400
    with SessionLocal() as db:
        assert db.query(ActivityLog).filter(ActivityLog.action.in_(["member.invitation_resent", "member.invitation_cancelled"])).count() >= 2


def test_pending_invite_acceptance_requires_token_email_not_expired_and_cannot_be_reused(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Accept Org")
    with SessionLocal() as db:
        role_id = _role(db, "organization_member").id

    invite = client.post(
        "/api/v1/invitations",
        json={"email": "invite-accept-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    ).json()
    _create_user(client, "invite-accept-target@example.com")
    _create_user(client, "invite-accept-wrong@example.com")
    target_headers = _headers(client, "invite-accept-target@example.com")
    wrong_headers = _headers(client, "invite-accept-wrong@example.com")

    wrong_token = client.post(f"/api/v1/invitations/{invite['id']}/accept", json={"token": "not-the-token"}, headers=target_headers)
    wrong_user = client.post(f"/api/v1/invitations/{invite['id']}/accept", json={"token": invite["token"]}, headers=wrong_headers)
    accepted = client.post(f"/api/v1/invitations/{invite['id']}/accept", json={"token": invite["token"]}, headers=target_headers)
    reused = client.post(f"/api/v1/invitations/{invite['id']}/accept", json={"token": invite["token"]}, headers=target_headers)

    assert wrong_token.status_code == 400
    assert wrong_user.status_code == 403
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"
    assert reused.status_code == 400

    with SessionLocal() as db:
        target = _user(db, "invite-accept-target@example.com")
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=target.id).one_or_none() is not None
        assert len(_active_assignments(db, target.id, "organization", org["id"])) == 1
        assert db.query(Notification).filter_by(user_id=_user(db, "invite-platform@example.com").id, type="invitation.accepted").count() == 1
        invitee_notification = db.query(Notification).filter_by(user_id=target.id, entity_type="invitation", entity_id=str(invite["id"])).one()
        assert invitee_notification.type == "invitation.accepted"
        assert invitee_notification.is_read is True
        assert db.query(ActivityLog).filter_by(action="member.invitation_accepted", entity_id=str(invite["id"])).count() == 1

    expired_invite = client.post(
        "/api/v1/invitations",
        json={"email": "invite-expired-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    ).json()
    _create_user(client, "invite-expired-target@example.com")
    expired_headers = _headers(client, "invite-expired-target@example.com")
    with SessionLocal() as db:
        invitation = db.get(Invitation, expired_invite["id"])
        assert invitation is not None
        invitation.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        db.commit()

    expired = client.post(
        f"/api/v1/invitations/{expired_invite['id']}/accept",
        json={"token": expired_invite["token"]},
        headers=expired_headers,
    )
    assert expired.status_code == 400
    with SessionLocal() as db:
        invitation = db.get(Invitation, expired_invite["id"])
        assert invitation is not None
        assert invitation.status == "expired"


def test_invited_user_can_decline_pending_invite_without_member_manage_permission(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Decline Org")
    with SessionLocal() as db:
        role_id = _role(db, "organization_member").id

    invite = client.post(
        "/api/v1/invitations",
        json={"email": "invite-decline-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    ).json()
    _create_user(client, "invite-decline-target@example.com")
    target_headers = _headers(client, "invite-decline-target@example.com")

    decline = client.post(f"/api/v1/invitations/{invite['id']}/decline-in-app", headers=target_headers)
    accept_after_decline = client.post(
        f"/api/v1/invitations/{invite['id']}/accept",
        json={"token": invite["token"]},
        headers=target_headers,
    )

    assert decline.status_code == 200
    assert decline.json()["status"] == "declined"
    assert accept_after_decline.status_code == 400

    with SessionLocal() as db:
        target = _user(db, "invite-decline-target@example.com")
        assert db.query(OrganizationMember).filter_by(organization_id=org["id"], user_id=target.id).one_or_none() is None
        assert _active_assignments(db, target.id, "organization", org["id"]) == []
        invitee_notification = db.query(Notification).filter_by(user_id=target.id, entity_type="invitation", entity_id=str(invite["id"])).one()
        assert invitee_notification.type == "invitation.declined"
        assert invitee_notification.is_read is True
        assert db.query(Notification).filter_by(user_id=_user(db, "invite-platform@example.com").id, type="invitation.declined").count() == 1
        assert db.query(ActivityLog).filter_by(action="member.invitation_declined", entity_id=str(invite["id"])).count() == 1


def test_invite_role_scope_safety_and_no_unrelated_role_mutation(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Role Safety Org")
    workspace = _create_workspace(client, platform_headers, org["id"], name="Invite Role Safety Workspace")
    _create_user(client, "invite-role-safety-admin@example.com")
    admin_headers = _headers(client, "invite-role-safety-admin@example.com")

    with SessionLocal() as db:
        platform = _user(db, "invite-platform@example.com")
        admin = _user(db, "invite-role-safety-admin@example.com")
        _assign_role_direct(db, user=admin, role_key="organization_admin", scope_type="organization", scope_id=org["id"], assigned_by=platform.id)
        db.add(OrganizationMember(organization_id=org["id"], user_id=admin.id, member_role="admin"))
        platform_owner_id = _role(db, "platform_owner").id
        superuser_id = _role(db, "superuser").id
        org_member_id = _role(db, "organization_member").id
        workspace_member_id = _role(db, "workspace_member").id
        project_role_id = _role(db, "project_contributor").id
        assignment_count_before = db.query(RoleAssignment).count()

    platform_role_in_org = client.post(
        "/api/v1/invitations",
        json={"email": "platform-role-in-org@example.com", "organization_id": org["id"], "role_id": platform_owner_id},
        headers=admin_headers,
    )
    superuser_in_org = client.post(
        "/api/v1/invitations",
        json={"email": "superuser-in-org@example.com", "organization_id": org["id"], "role_id": superuser_id},
        headers=admin_headers,
    )
    org_role_in_workspace = client.post(
        "/api/v1/invitations",
        json={"email": "org-role-in-workspace@example.com", "organization_id": org["id"], "workspace_id": workspace["id"], "role_id": org_member_id},
        headers=platform_headers,
    )
    project_role_in_workspace = client.post(
        "/api/v1/invitations",
        json={"email": "project-role-in-workspace@example.com", "organization_id": org["id"], "workspace_id": workspace["id"], "role_id": project_role_id},
        headers=platform_headers,
    )
    workspace_role_in_org = client.post(
        "/api/v1/invitations",
        json={"email": "workspace-role-in-org@example.com", "organization_id": org["id"], "role_id": workspace_member_id},
        headers=platform_headers,
    )
    valid_workspace_role = client.post(
        "/api/v1/invitations",
        json={"email": "valid-workspace-role@example.com", "organization_id": org["id"], "workspace_id": workspace["id"], "role_id": workspace_member_id},
        headers=platform_headers,
    )

    assert platform_role_in_org.status_code == 400
    assert superuser_in_org.status_code == 400
    assert org_role_in_workspace.status_code == 400
    assert project_role_in_workspace.status_code == 400
    assert workspace_role_in_org.status_code == 400
    assert valid_workspace_role.status_code == 201
    assert valid_workspace_role.json()["status"] == "pending"

    with SessionLocal() as db:
        # Rejected invites must not create role assignments; the single valid pending invite has not been accepted yet.
        assert db.query(RoleAssignment).count() == assignment_count_before


def test_invite_acceptance_bumps_access_version_and_does_not_grant_outside_scope(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    org = _create_org(client, platform_headers, "Invite Version Org")
    other_org = _create_org(client, platform_headers, "Invite Version Other Org")
    with SessionLocal() as db:
        role_id = _role(db, "organization_member").id

    version_before = client.get(f"/api/v1/context/version?organization_id={org['id']}", headers=platform_headers)
    other_version_before = client.get(f"/api/v1/context/version?organization_id={other_org['id']}", headers=platform_headers)
    assert version_before.status_code == 200
    assert other_version_before.status_code == 200

    invite = client.post(
        "/api/v1/invitations",
        json={"email": "invite-version-target@example.com", "organization_id": org["id"], "role_id": role_id},
        headers=platform_headers,
    ).json()
    _create_user(client, "invite-version-target@example.com")
    target_headers = _headers(client, "invite-version-target@example.com")
    accepted = client.post(f"/api/v1/invitations/{invite['id']}/accept", json={"token": invite["token"]}, headers=target_headers)

    assert accepted.status_code == 200
    version_after = client.get(f"/api/v1/context/version?organization_id={org['id']}", headers=platform_headers)
    other_version_after = client.get(f"/api/v1/context/version?organization_id={other_org['id']}", headers=platform_headers)
    assert version_after.json()["access_version"] > version_before.json()["access_version"]
    assert other_version_after.json()["access_version"] == other_version_before.json()["access_version"]

    with SessionLocal() as db:
        target = _user(db, "invite-version-target@example.com")
        assert "settings.organization.view" in _permission_codes(db, target.id, "organization", org["id"])
        assert "settings.organization.view" not in _permission_codes(db, target.id, "organization", other_org["id"])
