from tests.conftest import auth_headers, create_auth_headers, create_test_organization, create_test_user, create_test_workspace, get_auth_token


def test_create_team(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])

    response = client.post(
        "/api/v1/teams",
        json={"workspace_id": workspace["id"], "name": "Platform Team", "description": "Owns platform delivery"},
        headers=headers,
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["workspace_id"] == workspace["id"]
    assert payload["name"] == "Platform Team"


def test_organization_auditor_cannot_create_team(client):
    owner_headers = create_auth_headers(client)
    organization = create_test_organization(client, owner_headers)
    workspace = create_test_workspace(client, owner_headers, organization["id"])
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

    response = client.post(
        "/api/v1/teams",
        json={"workspace_id": workspace["id"], "name": "Audit Team"},
        headers=auditor_headers,
    )

    assert response.status_code == 403
