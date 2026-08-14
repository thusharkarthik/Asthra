from app.db.session import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.user import RoleAssignment, User
from tests.conftest import auth_headers, create_test_user, get_auth_token


PERSONAL_ENDPOINTS = [
    ("GET", "/api/v1/me", None),
    ("PATCH", "/api/v1/me", {"full_name": "Unauthorized"}),
    ("POST", "/api/v1/me/change-password", {"current_password": "password123", "new_password": "new-password-123"}),
    ("POST", "/api/v1/me/deactivate", None),
]


def _user(email: str) -> User:
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).one()
        db.expunge(user)
        return user


def _role_assignment_count() -> int:
    with SessionLocal() as db:
        return db.query(RoleAssignment).count()


def _activity_descriptions_for_user(email: str) -> list[str]:
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).one()
        rows = (
            db.query(ActivityLog)
            .filter(ActivityLog.actor_user_id == user.id)
            .order_by(ActivityLog.id)
            .all()
        )
        return [row.description or "" for row in rows]


def test_personal_settings_endpoints_require_authentication(client) -> None:
    for method, path, payload in PERSONAL_ENDPOINTS:
        response = client.request(method, path, json=payload)
        assert response.status_code in {401, 403}

    auth_me_response = client.get("/api/v1/auth/me")
    assert auth_me_response.status_code in {401, 403}


def test_user_can_read_and_update_own_profile_without_org_scope(client) -> None:
    create_test_user(client, email="profile-owner@example.com", password="password123", full_name="Profile Owner")
    token = get_auth_token(client, email="profile-owner@example.com", password="password123")
    headers = auth_headers(token)

    read_response = client.get("/api/v1/me", headers=headers)
    update_response = client.patch(
        "/api/v1/me",
        json={
            "full_name": "Profile Owner Updated",
            "job_title": "Platform Builder",
            "timezone": "Asia/Kolkata",
            "locale": "en",
            "avatar_url": "https://example.com/avatar.png",
        },
        headers=headers,
    )
    auth_me_response = client.get("/api/v1/auth/me", headers=headers)

    assert read_response.status_code == 200
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["email"] == "profile-owner@example.com"
    assert updated["full_name"] == "Profile Owner Updated"
    assert updated["job_title"] == "Platform Builder"
    assert updated["timezone"] == "Asia/Kolkata"
    assert updated["locale"] == "en"
    assert updated["avatar_url"] == "https://example.com/avatar.png"
    assert auth_me_response.status_code == 200
    assert auth_me_response.json()["full_name"] == "Profile Owner Updated"


def test_profile_update_is_self_owned_and_does_not_accept_privilege_or_sensitive_fields(client) -> None:
    create_test_user(client, email="platform-owner@example.com", password="password123", full_name="Platform Owner")
    create_test_user(client, email="ordinary-user@example.com", password="password123", full_name="Ordinary User")
    token = get_auth_token(client, email="ordinary-user@example.com", password="password123")
    headers = auth_headers(token)

    before_owner = _user("platform-owner@example.com")
    before_user = _user("ordinary-user@example.com")
    before_hash = before_user.hashed_password

    response = client.patch(
        "/api/v1/me",
        json={
            "full_name": "Ordinary User Updated",
            "is_superuser": True,
            "is_active": False,
            "hashed_password": "not-a-real-hash",
            "password": "bad-news",
            "email": "hijack@example.com",
            "role_assignments": [{"scope_type": "platform"}],
        },
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "ordinary-user@example.com"
    assert payload["full_name"] == "Ordinary User Updated"
    assert payload["is_active"] is True
    assert payload["is_superuser"] is False
    assert "hashed_password" not in payload
    assert "password" not in payload
    assert "role_assignments" not in payload

    after_owner = _user("platform-owner@example.com")
    after_user = _user("ordinary-user@example.com")
    assert after_owner.full_name == before_owner.full_name
    assert after_owner.is_superuser == before_owner.is_superuser
    assert after_user.is_superuser is False
    assert after_user.is_active is True
    assert after_user.hashed_password == before_hash


def test_password_change_requires_current_password_and_updates_login_credentials(client) -> None:
    create_test_user(client, email="password-user@example.com", password="password123", full_name="Password User")
    token = get_auth_token(client, email="password-user@example.com", password="password123")
    headers = auth_headers(token)

    wrong_current = client.post(
        "/api/v1/me/change-password",
        json={"current_password": "wrong-password", "new_password": "new-password-123"},
        headers=headers,
    )
    too_short = client.post(
        "/api/v1/me/change-password",
        json={"current_password": "password123", "new_password": "short"},
        headers=headers,
    )
    same_password = client.post(
        "/api/v1/me/change-password",
        json={"current_password": "password123", "new_password": "password123"},
        headers=headers,
    )
    success = client.post(
        "/api/v1/me/change-password",
        json={"current_password": "password123", "new_password": "new-password-123"},
        headers=headers,
    )
    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": "password-user@example.com", "password": "password123"},
    )
    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "password-user@example.com", "password": "new-password-123"},
    )

    assert wrong_current.status_code == 400
    assert too_short.status_code == 422
    assert same_password.status_code == 400
    assert success.status_code == 204
    assert old_login.status_code == 401
    assert new_login.status_code == 200

    descriptions = " ".join(_activity_descriptions_for_user("password-user@example.com"))
    assert "new-password-123" not in descriptions
    assert "password123" not in descriptions


def test_personal_profile_and_password_updates_do_not_mutate_role_assignments(client) -> None:
    create_test_user(client, email="rbac-anchor@example.com", password="password123", full_name="RBAC Anchor")
    create_test_user(client, email="rbac-safe-user@example.com", password="password123", full_name="RBAC Safe User")
    token = get_auth_token(client, email="rbac-safe-user@example.com", password="password123")
    headers = auth_headers(token)
    before_count = _role_assignment_count()

    profile_response = client.patch(
        "/api/v1/me",
        json={"full_name": "RBAC Safe User Updated", "timezone": "UTC", "locale": "en"},
        headers=headers,
    )
    password_response = client.post(
        "/api/v1/me/change-password",
        json={"current_password": "password123", "new_password": "safe-password-123"},
        headers=headers,
    )

    assert profile_response.status_code == 200
    assert password_response.status_code == 204
    assert _role_assignment_count() == before_count


def test_user_cannot_read_unrelated_user_profile_without_shared_membership(client) -> None:
    create_test_user(client, email="directory-owner@example.com", password="password123", full_name="Directory Owner")
    create_test_user(client, email="directory-outsider@example.com", password="password123", full_name="Directory Outsider")
    token = get_auth_token(client, email="directory-outsider@example.com", password="password123")
    owner = _user("directory-owner@example.com")

    response = client.get(f"/api/v1/users/{owner.id}", headers=auth_headers(token))

    assert response.status_code == 403


def test_deactivate_my_account_deactivates_only_current_user_and_blocks_login(client) -> None:
    create_test_user(client, email="platform-keeper@example.com", password="password123", full_name="Platform Keeper")
    create_test_user(client, email="deactivate-me@example.com", password="password123", full_name="Deactivate Me")
    token = get_auth_token(client, email="deactivate-me@example.com", password="password123")
    headers = auth_headers(token)
    before_count = _role_assignment_count()

    response = client.post("/api/v1/me/deactivate", headers=headers)
    inactive_me = client.get("/api/v1/me", headers=headers)
    login_after_deactivate = client.post(
        "/api/v1/auth/login",
        json={"email": "deactivate-me@example.com", "password": "password123"},
    )

    assert response.status_code == 204
    assert inactive_me.status_code == 401
    assert login_after_deactivate.status_code == 403
    assert _user("deactivate-me@example.com").is_active is False
    assert _user("platform-keeper@example.com").is_active is True
    assert _role_assignment_count() == before_count


def test_only_active_superuser_cannot_self_deactivate(client) -> None:
    create_test_user(client, email="sole-superuser@example.com", password="password123", full_name="Sole Superuser")
    token = get_auth_token(client, email="sole-superuser@example.com", password="password123")

    response = client.post("/api/v1/me/deactivate", headers=auth_headers(token))

    assert response.status_code == 400
    assert _user("sole-superuser@example.com").is_active is True
