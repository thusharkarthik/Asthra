from datetime import datetime, timezone

from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.services.access_control_service import AccessControlService
from app.services.role_service import RoleService
from tests.conftest import auth_headers, create_test_organization, create_test_user, get_auth_token


def _role(db, key: str) -> Role:
    RoleService(db).ensure_role_catalog()
    role = db.query(Role).filter(Role.key == key, Role.is_active.is_(True)).one()
    return role


def _user(db, email: str) -> User:
    return db.query(User).filter(User.email == email).one()


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


def _access_request_payload() -> dict[str, str]:
    return {
        "page": "/settings/members",
        "message": "Navigation item: Members\nNavigation key: organization.members\nMode: org\nMissing permissions: settings.member.view",
    }


def test_access_request_requires_authentication(client) -> None:
    response = client.post("/api/v1/notifications/access-request", json=_access_request_payload())

    assert response.status_code in {401, 403}


def test_access_request_creates_org_admin_notification_and_preserves_context_without_granting_access(client) -> None:
    create_test_user(client, email="access-owner@example.com", full_name="Access Owner")
    owner_token = get_auth_token(client, email="access-owner@example.com")
    owner_headers = auth_headers(owner_token)
    organization = create_test_organization(client, owner_headers, name="Access Request Org")
    create_test_user(client, email="access-member@example.com", full_name="Access Member")
    member_token = get_auth_token(client, email="access-member@example.com")
    member_headers = auth_headers(member_token)

    with SessionLocal() as db:
        owner = _user(db, "access-owner@example.com")
        member = _user(db, "access-member@example.com")
        _assign_role(db, user=owner, role_key="organization_owner", scope_type="organization", scope_id=organization["id"], assigned_by=owner.id)
        _assign_role(db, user=member, role_key="organization_member", scope_type="organization", scope_id=organization["id"], assigned_by=owner.id)
        before_permissions = set(AccessControlService(db).get_user_permissions(member.id, "organization", organization["id"])["permission_codes"])
        before_assignments = db.query(RoleAssignment).filter(RoleAssignment.user_id == member.id).count()

    response = client.post("/api/v1/notifications/access-request", json=_access_request_payload(), headers=member_headers)

    assert response.status_code == 200
    assert response.json() == {"sent": True}

    owner_notifications = client.get("/api/v1/notifications?type=access_request", headers=owner_headers)
    assert owner_notifications.status_code == 200
    notifications = owner_notifications.json()
    assert len(notifications) == 1
    notification = notifications[0]
    assert notification["title"] == "Access Request"
    assert notification["type"] == "access_request"
    assert notification["entity_type"] == "user_profile"
    assert "Access Member is requesting access to: /settings/members." in notification["message"]
    assert "Navigation item: Members" in notification["message"]
    assert "Navigation key: organization.members" in notification["message"]
    assert "settings.member.view" in notification["message"]

    with SessionLocal() as db:
        member = _user(db, "access-member@example.com")
        after_permissions = set(AccessControlService(db).get_user_permissions(member.id, "organization", organization["id"])["permission_codes"])
        after_assignments = db.query(RoleAssignment).filter(RoleAssignment.user_id == member.id).count()

    assert after_permissions == before_permissions
    assert after_assignments == before_assignments
    assert "settings.member.view" not in after_permissions


def test_access_request_falls_back_to_platform_admin_when_no_org_admin_exists(client) -> None:
    create_test_user(client, email="platform-recipient@example.com", full_name="Platform Recipient")
    platform_token = get_auth_token(client, email="platform-recipient@example.com")
    platform_headers = auth_headers(platform_token)
    create_test_user(client, email="platform-requester@example.com", full_name="Platform Requester")
    requester_token = get_auth_token(client, email="platform-requester@example.com")

    response = client.post(
        "/api/v1/notifications/access-request",
        json={"page": "/settings/feature-flags", "message": "Missing permissions: settings.feature_flags.view"},
        headers=auth_headers(requester_token),
    )

    assert response.status_code == 200
    notifications = client.get("/api/v1/notifications?type=access_request", headers=platform_headers).json()
    assert len(notifications) == 1
    assert "Platform Requester is requesting access to: /settings/feature-flags." in notifications[0]["message"]
    assert "settings.feature_flags.view" in notifications[0]["message"]


def test_access_request_without_available_admin_fails_safely(client) -> None:
    create_test_user(client, email="solo-requester@example.com", full_name="Solo Requester")
    token = get_auth_token(client, email="solo-requester@example.com")

    response = client.post(
        "/api/v1/notifications/access-request",
        json={"page": "/settings/navigation", "message": "Need navigation access."},
        headers=auth_headers(token),
    )

    assert response.status_code == 404
    assert "No admin found" in response.json()["detail"]

    with SessionLocal() as db:
        requester = _user(db, "solo-requester@example.com")
        assert db.query(Notification).filter(Notification.type == "access_request").count() == 0
        assert db.query(RoleAssignment).filter(RoleAssignment.user_id == requester.id).count() == 2


def test_duplicate_access_requests_are_allowed_and_create_separate_notifications(client) -> None:
    create_test_user(client, email="duplicate-owner@example.com", full_name="Duplicate Owner")
    owner_token = get_auth_token(client, email="duplicate-owner@example.com")
    owner_headers = auth_headers(owner_token)
    organization = create_test_organization(client, owner_headers, name="Duplicate Access Org")
    create_test_user(client, email="duplicate-member@example.com", full_name="Duplicate Member")
    member_token = get_auth_token(client, email="duplicate-member@example.com")
    member_headers = auth_headers(member_token)

    with SessionLocal() as db:
        owner = _user(db, "duplicate-owner@example.com")
        member = _user(db, "duplicate-member@example.com")
        _assign_role(db, user=owner, role_key="organization_owner", scope_type="organization", scope_id=organization["id"], assigned_by=owner.id)
        _assign_role(db, user=member, role_key="organization_member", scope_type="organization", scope_id=organization["id"], assigned_by=owner.id)

    first = client.post("/api/v1/notifications/access-request", json=_access_request_payload(), headers=member_headers)
    second = client.post("/api/v1/notifications/access-request", json=_access_request_payload(), headers=member_headers)

    assert first.status_code == 200
    assert second.status_code == 200
    notifications = client.get("/api/v1/notifications?type=access_request", headers=owner_headers).json()
    assert len(notifications) == 2
