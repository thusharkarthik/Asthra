from __future__ import annotations

from hashlib import sha256

from app.db.session import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.api_key import APIKey
from app.models.organization import OrganizationMember
from app.models.user import RoleAssignment, User
from tests.conftest import auth_headers, create_test_organization, create_test_user, create_test_workspace, get_auth_token


def _api_key_by_id(api_key_id: int) -> APIKey:
    with SessionLocal() as db:
        api_key = db.get(APIKey, api_key_id)
        assert api_key is not None
        return api_key


def _activity_for_api_key(api_key_id: int, action: str) -> ActivityLog | None:
    with SessionLocal() as db:
        return (
            db.query(ActivityLog)
            .filter(
                ActivityLog.entity_type == "api_key",
                ActivityLog.entity_id == str(api_key_id),
                ActivityLog.action == action,
            )
            .one_or_none()
        )


def _role_assignment_count() -> int:
    with SessionLocal() as db:
        return db.query(RoleAssignment).count()


def test_api_keys_require_authentication(client) -> None:
    create_response = client.post("/api/v1/api-keys", json={"name": "No Auth"})
    list_response = client.get("/api/v1/api-keys")
    detail_response = client.get("/api/v1/api-keys/1")
    revoke_response = client.post("/api/v1/api-keys/1/revoke")
    delete_response = client.delete("/api/v1/api-keys/1")

    assert create_response.status_code in {401, 403}
    assert list_response.status_code in {401, 403}
    assert detail_response.status_code in {401, 403}
    assert revoke_response.status_code in {401, 403}
    assert delete_response.status_code in {401, 403}


def test_api_key_secret_is_returned_once_hashed_at_rest_and_redacted_from_reads_and_audit(client) -> None:
    create_test_user(client, email="api-key-owner@example.com", full_name="API Key Owner")
    token = get_auth_token(client, email="api-key-owner@example.com")
    headers = auth_headers(token)

    create_response = client.post(
        "/api/v1/api-keys",
        json={"name": "CI Pipeline", "scopes": ["read"], "expires_at": None},
        headers=headers,
    )

    assert create_response.status_code == 201
    created = create_response.json()
    raw_key = created["api_key"]
    assert raw_key.startswith("ak_")
    assert created["key_prefix"] == raw_key[:12]
    assert "hashed_key" not in created

    stored = _api_key_by_id(created["id"])
    assert stored.hashed_key == sha256(raw_key.encode("utf-8")).hexdigest()
    assert stored.hashed_key != raw_key
    assert stored.key_prefix in raw_key

    list_response = client.get("/api/v1/api-keys", headers=headers)
    detail_response = client.get(f"/api/v1/api-keys/{created['id']}", headers=headers)

    assert list_response.status_code == 200
    assert detail_response.status_code == 200
    listed = list_response.json()[0]
    detailed = detail_response.json()
    assert "api_key" not in listed
    assert "hashed_key" not in listed
    assert "api_key" not in detailed
    assert "hashed_key" not in detailed
    assert listed["key_prefix"] == raw_key[:12]
    assert detailed["key_prefix"] == raw_key[:12]

    activity = _activity_for_api_key(created["id"], "api_key.created")
    assert activity is not None
    assert raw_key not in (activity.description or "")
    assert raw_key not in str(activity.event_metadata or {})


def test_api_keys_are_owner_isolated_for_list_detail_revoke_and_delete(client) -> None:
    create_test_user(client, email="key-owner-a@example.com", full_name="Key Owner A")
    create_test_user(client, email="key-owner-b@example.com", full_name="Key Owner B")
    token_a = get_auth_token(client, email="key-owner-a@example.com")
    token_b = get_auth_token(client, email="key-owner-b@example.com")
    headers_a = auth_headers(token_a)
    headers_b = auth_headers(token_b)

    created = client.post("/api/v1/api-keys", json={"name": "Owner A Key", "scopes": ["read"]}, headers=headers_a).json()

    list_b = client.get("/api/v1/api-keys", headers=headers_b)
    detail_b = client.get(f"/api/v1/api-keys/{created['id']}", headers=headers_b)
    revoke_b = client.post(f"/api/v1/api-keys/{created['id']}/revoke", headers=headers_b)
    delete_b = client.delete(f"/api/v1/api-keys/{created['id']}", headers=headers_b)
    detail_a = client.get(f"/api/v1/api-keys/{created['id']}", headers=headers_a)

    assert list_b.status_code == 200
    assert list_b.json() == []
    assert detail_b.status_code == 404
    assert revoke_b.status_code == 404
    assert delete_b.status_code == 404
    assert detail_a.status_code == 200
    assert detail_a.json()["id"] == created["id"]


def test_api_key_scope_metadata_requires_access_to_requested_scope(client) -> None:
    create_test_user(client, email="scope-owner@example.com", full_name="Scope Owner")
    owner_token = get_auth_token(client, email="scope-owner@example.com")
    owner_headers = auth_headers(owner_token)
    organization = create_test_organization(client, owner_headers, name="API Key Scope Org")
    workspace = create_test_workspace(client, owner_headers, organization["id"], name="API Key Workspace")
    create_test_user(client, email="scope-member@example.com", full_name="Scope Member")
    member_token = get_auth_token(client, email="scope-member@example.com")
    member_headers = auth_headers(member_token)

    denied = client.post(
        "/api/v1/api-keys",
        json={"name": "Denied Scope", "organization_id": organization["id"], "scopes": ["read"]},
        headers=member_headers,
    )

    with SessionLocal() as db:
        member = db.query(User).filter(User.email == "scope-member@example.com").one()
        db.add(OrganizationMember(organization_id=organization["id"], user_id=member.id, member_role="member"))
        db.commit()

    allowed_org = client.post(
        "/api/v1/api-keys",
        json={"name": "Allowed Org Scope", "organization_id": organization["id"], "scopes": ["read"]},
        headers=member_headers,
    )
    mismatch = client.post(
        "/api/v1/api-keys",
        json={"name": "Mismatched Scope", "organization_id": organization["id"] + 999, "workspace_id": workspace["id"], "scopes": ["read"]},
        headers=member_headers,
    )

    assert denied.status_code == 403
    assert allowed_org.status_code == 201
    assert allowed_org.json()["organization_id"] == organization["id"]
    assert mismatch.status_code in {400, 404}


def test_revoke_is_safe_and_revoked_key_cannot_be_reactivated(client) -> None:
    create_test_user(client, email="revoke-key@example.com", full_name="Revoke Key")
    token = get_auth_token(client, email="revoke-key@example.com")
    headers = auth_headers(token)
    created = client.post("/api/v1/api-keys", json={"name": "Revocable", "scopes": ["read"]}, headers=headers).json()

    first_revoke = client.post(f"/api/v1/api-keys/{created['id']}/revoke", headers=headers)
    second_revoke = client.post(f"/api/v1/api-keys/{created['id']}/revoke", headers=headers)
    reactivate = client.patch(f"/api/v1/api-keys/{created['id']}", json={"is_active": True}, headers=headers)
    detail = client.get(f"/api/v1/api-keys/{created['id']}", headers=headers)

    assert first_revoke.status_code == 200
    assert first_revoke.json()["is_active"] is False
    assert second_revoke.status_code == 200
    assert second_revoke.json()["is_active"] is False
    assert reactivate.status_code == 400
    assert detail.status_code == 200
    assert detail.json()["is_active"] is False


def test_api_key_create_revoke_and_delete_do_not_mutate_rbac_and_create_safe_audit_events(client) -> None:
    create_test_user(client, email="safe-key@example.com", full_name="Safe Key")
    token = get_auth_token(client, email="safe-key@example.com")
    headers = auth_headers(token)
    before_assignments = _role_assignment_count()

    created_response = client.post("/api/v1/api-keys", json={"name": "Safe Key", "scopes": ["read"]}, headers=headers)
    assert created_response.status_code == 201
    created = created_response.json()
    raw_key = created["api_key"]

    list_response = client.get("/api/v1/api-keys", headers=headers)
    revoke_response = client.post(f"/api/v1/api-keys/{created['id']}/revoke", headers=headers)
    delete_response = client.delete(f"/api/v1/api-keys/{created['id']}", headers=headers)

    assert list_response.status_code == 200
    assert revoke_response.status_code == 200
    assert delete_response.status_code == 204
    assert _role_assignment_count() == before_assignments

    for action in ["api_key.created", "api_key.revoked", "api_key.deleted"]:
        activity = _activity_for_api_key(created["id"], action)
        assert activity is not None
        assert raw_key not in (activity.description or "")
        assert raw_key not in str(activity.event_metadata or {})
