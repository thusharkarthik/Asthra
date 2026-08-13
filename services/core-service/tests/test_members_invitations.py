from tests.conftest import (
    auth_headers,
    create_auth_headers,
    create_test_organization,
    create_test_user,
    create_test_workspace,
    get_auth_token,
)


def test_invite_existing_user_adds_membership(client):
    owner_headers = create_auth_headers(client)
    organization = create_test_organization(client, owner_headers)
    create_test_user(client, email="member@example.com", full_name="Member User")

    response = client.post(
        "/api/v1/invitations",
        json={"email": "member@example.com", "organization_id": organization["id"]},
        headers=owner_headers,
    )

    assert response.status_code == 201
    assert response.json()["status"] == "accepted"

    members_response = client.get(f"/api/v1/organizations/{organization['id']}/members", headers=owner_headers)
    assert members_response.status_code == 200
    assert len(members_response.json()) == 2


def test_role_catalog_lists_scoped_asthra_roles(client):
    headers = create_auth_headers(client)

    response = client.get("/api/v1/roles", headers=headers)

    assert response.status_code == 200
    roles = response.json()
    role_keys = {role["key"] for role in roles}
    assert "platform_owner" in role_keys
    assert "organization_owner" in role_keys
    assert "workspace_member" in role_keys
    assert "project_contributor" in role_keys
    assert "team_lead" in role_keys
    assert "incident_commander" in role_keys
    assert all(role["permission_preset"].endswith(":placeholder") for role in roles)


def test_invite_new_email_creates_pending_invitation_and_prevents_duplicate(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)

    response = client.post(
        "/api/v1/invitations",
        json={"email": "pending@example.com", "organization_id": organization["id"]},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["status"] == "pending"

    duplicate_response = client.post(
        "/api/v1/invitations",
        json={"email": "pending@example.com", "organization_id": organization["id"]},
        headers=headers,
    )

    assert duplicate_response.status_code == 409


def test_pending_invitation_notification_after_signup(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    workspace = create_test_workspace(client, headers, organization["id"])
    roles = client.get("/api/v1/roles", headers=headers).json()
    workspace_member_role = next(role for role in roles if role["key"] == "workspace_member")

    invitation_response = client.post(
        "/api/v1/invitations",
        json={
            "email": "future@example.com",
            "organization_id": organization["id"],
            "workspace_id": workspace["id"],
            "role_id": workspace_member_role["id"],
        },
        headers=headers,
    )
    assert invitation_response.status_code == 201
    assert invitation_response.json()["status"] == "pending"

    create_test_user(client, email="future@example.com", full_name="Future Member")
    future_token = get_auth_token(client, email="future@example.com")
    notifications_response = client.get("/api/v1/notifications", headers=auth_headers(future_token))

    assert notifications_response.status_code == 200
    notifications = notifications_response.json()
    assert any(
        notification["type"] == "invitation.pending"
        and "Workspace Member" in notification["message"]
        for notification in notifications
    )


def test_resend_and_cancel_pending_invitation(client):
    headers = create_auth_headers(client)
    organization = create_test_organization(client, headers)
    invitation = client.post(
        "/api/v1/invitations",
        json={"email": "pending@example.com", "organization_id": organization["id"]},
        headers=headers,
    ).json()

    resend_response = client.post(f"/api/v1/invitations/{invitation['id']}/resend", headers=headers)
    assert resend_response.status_code == 200
    assert resend_response.json()["status"] == "pending"

    revoke_response = client.post(f"/api/v1/invitations/{invitation['id']}/revoke", headers=headers)
    assert revoke_response.status_code == 200
    assert revoke_response.json()["status"] == "cancelled"


def test_change_role_remove_member_and_protect_last_owner(client):
    owner_headers = create_auth_headers(client)
    organization = create_test_organization(client, owner_headers)
    create_test_user(client, email="member@example.com", full_name="Member User")
    client.post(
        "/api/v1/invitations",
        json={"email": "member@example.com", "organization_id": organization["id"]},
        headers=owner_headers,
    )
    member_token = get_auth_token(client, email="member@example.com")
    member_me = client.get("/api/v1/users/me", headers=auth_headers(member_token)).json()

    update_response = client.patch(
        f"/api/v1/organizations/{organization['id']}/members/{member_me['id']}",
        json={"member_role": "manager"},
        headers=owner_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["member_role"] == "manager"

    owner_me = client.get("/api/v1/users/me", headers=owner_headers).json()
    last_owner_update = client.patch(
        f"/api/v1/organizations/{organization['id']}/members/{owner_me['id']}",
        json={"member_role": "member"},
        headers=owner_headers,
    )
    assert last_owner_update.status_code == 400

    last_owner_remove = client.delete(
        f"/api/v1/organizations/{organization['id']}/members/{owner_me['id']}",
        headers=owner_headers,
    )
    assert last_owner_remove.status_code == 400

    remove_response = client.delete(
        f"/api/v1/organizations/{organization['id']}/members/{member_me['id']}",
        headers=owner_headers,
    )
    assert remove_response.status_code == 204


def test_workspace_member_role_update_and_last_owner_protection(client):
    owner_headers = create_auth_headers(client)
    organization = create_test_organization(client, owner_headers)
    workspace = create_test_workspace(client, owner_headers, organization["id"])

    owner_me = client.get("/api/v1/users/me", headers=owner_headers).json()
    update_response = client.patch(
        f"/api/v1/workspaces/{workspace['id']}/members/{owner_me['id']}",
        json={"member_role": "member"},
        headers=owner_headers,
    )
    assert update_response.status_code == 400
