from tests.conftest import auth_headers, create_auth_headers, create_test_organization, create_test_user, get_auth_token


def test_create_organization(client):
    headers = create_auth_headers(client)

    response = client.post(
        "/api/v1/organizations",
        json={"name": "Acme", "description": "Primary organization"},
        headers=headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["name"] == "Acme"
    assert payload["description"] == "Primary organization"
    assert payload["is_active"] is True
    assert payload["created_by_id"] is not None


def test_update_organization(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)

    response = client.patch(
        f"/api/v1/organizations/{organization['id']}",
        json={"name": "Acme Labs", "description": "Updated organization"},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "Acme Labs"
    assert payload["description"] == "Updated organization"


def test_organization_auditor_cannot_update_organization(client):
    owner_headers = create_auth_headers(client)
    organization = create_test_organization(client, owner_headers)
    create_test_user(client, email="auditor@example.com", full_name="Audit User")
    roles = client.get("/api/v1/roles", headers=owner_headers).json()
    auditor_role = next(role for role in roles if role["key"] == "organization_auditor")
    invite_response = client.post(
        "/api/v1/invitations",
        json={"email": "auditor@example.com", "organization_id": organization["id"], "role_id": auditor_role["id"]},
        headers=owner_headers,
    )
    assert invite_response.status_code in {200, 201}
    auditor_headers = auth_headers(get_auth_token(client, email="auditor@example.com"))

    response = client.patch(
        f"/api/v1/organizations/{organization['id']}",
        json={"name": "Blocked"},
        headers=auditor_headers,
    )

    assert response.status_code == 403
