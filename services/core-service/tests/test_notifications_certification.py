from datetime import datetime, timedelta, timezone

from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.services.access_control_service import AccessControlService
from app.services.notification_service import NotificationService
from app.services.role_service import RoleService
from tests.conftest import auth_headers, create_test_organization, create_test_user, get_auth_token


def _user(db, email: str) -> User:
    return db.query(User).filter(User.email == email).one()


def _role(db, key: str) -> Role:
    RoleService(db).ensure_role_catalog()
    return db.query(Role).filter(Role.key == key, Role.is_active.is_(True)).one()


def _assign_role(db, *, user: User, role_key: str, scope_type: str, scope_id: int | None, assigned_by: int | None = None) -> RoleAssignment:
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


def _create_notification(email: str, *, title: str, type: str = "qa.notice", entity_type: str | None = None, entity_id: str | None = None) -> int:
    with SessionLocal() as db:
        user = _user(db, email)
        notification = NotificationService(db).create_notification(
            user_id=user.id,
            type=type,
            title=title,
            message=f"{title} message",
            entity_type=entity_type,
            entity_id=entity_id,
        )
        return notification.id


def _unread_count(client, token: str) -> int:
    response = client.get("/api/v1/notifications?is_read=false", headers=auth_headers(token))
    assert response.status_code == 200
    return len(response.json())


def test_notifications_require_authentication(client) -> None:
    assert client.get("/api/v1/notifications").status_code in {401, 403}
    assert client.patch("/api/v1/notifications/1/read").status_code in {401, 403}
    assert client.patch("/api/v1/notifications/read-all").status_code in {401, 403}


def test_notifications_empty_state_returns_empty_list_and_zero_unread(client) -> None:
    create_test_user(client, email="empty-notifications@example.com")
    token = get_auth_token(client, email="empty-notifications@example.com")

    all_notifications = client.get("/api/v1/notifications", headers=auth_headers(token))
    unread_notifications = client.get("/api/v1/notifications?is_read=false", headers=auth_headers(token))

    assert all_notifications.status_code == 200
    assert all_notifications.json() == []
    assert unread_notifications.status_code == 200
    assert unread_notifications.json() == []


def test_user_sees_only_own_notifications_and_cannot_mark_another_users_notification(client) -> None:
    create_test_user(client, email="notify-a@example.com")
    create_test_user(client, email="notify-b@example.com")
    token_a = get_auth_token(client, email="notify-a@example.com")
    token_b = get_auth_token(client, email="notify-b@example.com")
    own_id = _create_notification("notify-a@example.com", title="Own notification", entity_type="organization", entity_id="12")
    other_id = _create_notification("notify-b@example.com", title="Other notification")

    list_a = client.get("/api/v1/notifications", headers=auth_headers(token_a))
    assert list_a.status_code == 200
    payload = list_a.json()
    assert [item["id"] for item in payload] == [own_id]
    assert payload[0]["title"] == "Own notification"
    assert payload[0]["entity_type"] == "organization"
    assert payload[0]["entity_id"] == "12"

    forbidden_read = client.patch(f"/api/v1/notifications/{other_id}/read", headers=auth_headers(token_a))
    assert forbidden_read.status_code == 404

    list_b = client.get("/api/v1/notifications", headers=auth_headers(token_b))
    assert [item["id"] for item in list_b.json()] == [other_id]
    assert list_b.json()[0]["is_read"] is False


def test_notification_listing_returns_newest_first_and_expected_fields(client) -> None:
    create_test_user(client, email="ordered-notifications@example.com")
    token = get_auth_token(client, email="ordered-notifications@example.com")
    older_id = _create_notification("ordered-notifications@example.com", title="Older", type="qa.older")
    newer_id = _create_notification("ordered-notifications@example.com", title="Newer", type="qa.newer", entity_type="project", entity_id="99")

    with SessionLocal() as db:
        older = db.get(Notification, older_id)
        newer = db.get(Notification, newer_id)
        assert older is not None and newer is not None
        older.created_at = datetime.now(timezone.utc) - timedelta(days=1)
        newer.created_at = datetime.now(timezone.utc)
        db.commit()

    response = client.get("/api/v1/notifications", headers=auth_headers(token))
    assert response.status_code == 200
    payload = response.json()
    assert [item["id"] for item in payload] == [newer_id, older_id]
    assert set(["id", "type", "title", "message", "entity_type", "entity_id", "is_read", "created_at"]).issubset(payload[0].keys())
    assert payload[0]["type"] == "qa.newer"
    assert payload[0]["entity_type"] == "project"
    assert payload[0]["entity_id"] == "99"


def test_mark_read_is_idempotent_and_unread_count_decrements(client) -> None:
    create_test_user(client, email="read-notifications@example.com")
    token = get_auth_token(client, email="read-notifications@example.com")
    first_id = _create_notification("read-notifications@example.com", title="First")
    _create_notification("read-notifications@example.com", title="Second")

    assert _unread_count(client, token) == 2

    first_read = client.patch(f"/api/v1/notifications/{first_id}/read", headers=auth_headers(token))
    second_read = client.patch(f"/api/v1/notifications/{first_id}/read", headers=auth_headers(token))

    assert first_read.status_code == 200
    assert first_read.json()["is_read"] is True
    assert first_read.json()["read_at"] is not None
    assert second_read.status_code == 200
    assert second_read.json()["is_read"] is True
    assert _unread_count(client, token) == 1

    mark_all = client.patch("/api/v1/notifications/read-all", headers=auth_headers(token))
    assert mark_all.status_code == 200
    assert mark_all.json() == {"updated": 1}
    assert _unread_count(client, token) == 0


def test_mark_all_read_only_marks_current_users_notifications(client) -> None:
    create_test_user(client, email="markall-a@example.com")
    create_test_user(client, email="markall-b@example.com")
    token_a = get_auth_token(client, email="markall-a@example.com")
    token_b = get_auth_token(client, email="markall-b@example.com")
    _create_notification("markall-a@example.com", title="A one")
    _create_notification("markall-a@example.com", title="A two")
    _create_notification("markall-b@example.com", title="B one")

    response = client.patch("/api/v1/notifications/read-all", headers=auth_headers(token_a))

    assert response.status_code == 200
    assert response.json() == {"updated": 2}
    assert _unread_count(client, token_a) == 0
    assert _unread_count(client, token_b) == 1


def test_access_request_notification_preserves_context_and_does_not_mutate_access(client) -> None:
    create_test_user(client, email="notify-owner@example.com", full_name="Notify Owner")
    owner_token = get_auth_token(client, email="notify-owner@example.com")
    owner_headers = auth_headers(owner_token)
    organization = create_test_organization(client, owner_headers, name="Notification Request Org")
    create_test_user(client, email="notify-member@example.com", full_name="Notify Member")
    member_token = get_auth_token(client, email="notify-member@example.com")
    member_headers = auth_headers(member_token)

    with SessionLocal() as db:
        owner = _user(db, "notify-owner@example.com")
        member = _user(db, "notify-member@example.com")
        _assign_role(db, user=owner, role_key="organization_owner", scope_type="organization", scope_id=organization["id"], assigned_by=owner.id)
        _assign_role(db, user=member, role_key="organization_member", scope_type="organization", scope_id=organization["id"], assigned_by=owner.id)
        before_permissions = set(AccessControlService(db).get_user_permissions(member.id, "organization", organization["id"])["permission_codes"])
        before_assignments = db.query(RoleAssignment).filter(RoleAssignment.user_id == member.id).count()

    response = client.post(
        "/api/v1/notifications/access-request",
        json={
            "page": "/settings/members",
            "message": "Navigation item: Members\nNavigation key: organization.members\nMissing permissions: settings.member.view",
        },
        headers=member_headers,
    )
    assert response.status_code == 200
    assert response.json() == {"sent": True}

    notifications = client.get("/api/v1/notifications?type=access_request", headers=owner_headers)
    assert notifications.status_code == 200
    payload = notifications.json()
    assert len(payload) == 1
    notification = payload[0]
    assert notification["type"] == "access_request"
    assert notification["title"] == "Access Request"
    assert notification["entity_type"] == "user_profile"
    assert "Notify Member is requesting access to: /settings/members." in notification["message"]
    assert "Navigation key: organization.members" in notification["message"]
    assert "settings.member.view" in notification["message"]

    with SessionLocal() as db:
        member = _user(db, "notify-member@example.com")
        after_permissions = set(AccessControlService(db).get_user_permissions(member.id, "organization", organization["id"])["permission_codes"])
        after_assignments = db.query(RoleAssignment).filter(RoleAssignment.user_id == member.id).count()

    assert after_permissions == before_permissions
    assert after_assignments == before_assignments
    assert "settings.member.view" not in after_permissions
