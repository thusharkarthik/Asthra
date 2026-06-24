from tests.conftest import auth_headers, create_test_user, get_auth_token


def test_register_user(client):
    user = create_test_user(client)

    assert user["email"] == "user@example.com"
    assert user["full_name"] == "Test User"
    assert user["is_active"] is True
    assert user["is_superuser"] is True
    assert "hashed_password" not in user


def test_first_user_bootstraps_superuser_and_platform_owner(client):
    first_user = create_test_user(client, email="first@example.com")
    token = get_auth_token(client, email="first@example.com")
    headers = auth_headers(token)

    assert first_user["is_superuser"] is True

    permissions_response = client.get("/api/v1/me/permissions", headers=headers)
    assert permissions_response.status_code == 200
    permissions = permissions_response.json()
    role_keys = {role["key"] for role in permissions["roles"]}
    assert "superuser" in role_keys
    assert "platform_owner" in role_keys
    assert "settings.organization.create" in permissions["permission_codes"]


def test_second_registered_user_is_not_superuser(client):
    create_test_user(client, email="first@example.com")
    second_user = create_test_user(client, email="second@example.com")

    assert second_user["is_superuser"] is False


def test_register_rejects_duplicate_email(client):
    create_test_user(client)

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "password123",
            "full_name": "Duplicate User",
        },
    )

    assert response.status_code == 409


def test_login_user(client):
    create_test_user(client)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"]
    assert payload["token_type"] == "bearer"


def test_login_rejects_invalid_credentials(client):
    create_test_user(client)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_get_current_user_with_token(client):
    create_test_user(client)
    token = get_auth_token(client)

    response = client.get("/api/v1/auth/me", headers=auth_headers(token))

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
