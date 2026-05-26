from tests.conftest import auth_headers, create_test_user, get_auth_token


def test_register_user(client):
    user = create_test_user(client)

    assert user["email"] == "user@example.com"
    assert user["full_name"] == "Test User"
    assert user["is_active"] is True
    assert "hashed_password" not in user


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
