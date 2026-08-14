from datetime import datetime, timedelta, timezone

from app.db.session import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.organization import OrganizationMember
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.services.activity_service import ActivityService
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


def _add_org_membership(db, *, user: User, organization_id: int, member_role: str = "member") -> OrganizationMember:
    membership = OrganizationMember(organization_id=organization_id, user_id=user.id, member_role=member_role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def _log_activity(
    *,
    actor_email: str,
    action: str,
    entity_type: str = "organization",
    entity_id: str | None = "1",
    organization_id: int | None = None,
    description: str = "Certification audit event",
    metadata: dict | None = None,
) -> int:
    with SessionLocal() as db:
        actor = _user(db, actor_email)
        activity = ActivityService(db).log_activity(
            actor_user_id=actor.id,
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            description=description,
            metadata=metadata,
        )
        return activity.id


def test_audit_logs_require_authentication(client) -> None:
    assert client.get("/api/v1/activity").status_code in {401, 403}
    assert client.get("/api/v1/activity/1").status_code in {401, 403}


def test_user_without_audit_permission_cannot_list_global_or_org_audit_logs(client) -> None:
    create_test_user(client, email="audit-owner@example.com", full_name="Audit Owner")
    owner_token = get_auth_token(client, email="audit-owner@example.com")
    organization = create_test_organization(client, auth_headers(owner_token), name="Audit Permission Org")
    create_test_user(client, email="audit-member@example.com", full_name="Audit Member")
    member_token = get_auth_token(client, email="audit-member@example.com")

    with SessionLocal() as db:
        owner = _user(db, "audit-owner@example.com")
        member = _user(db, "audit-member@example.com")
        owner_id = owner.id
        member_id = member.id
        _add_org_membership(db, user=member, organization_id=organization["id"])

    org_activity_id = _log_activity(
        actor_email="audit-owner@example.com",
        organization_id=organization["id"],
        action="organization.updated",
        entity_id=str(organization["id"]),
    )
    personal_activity_id = _log_activity(
        actor_email="audit-owner@example.com",
        action="user.profile_updated",
        entity_type="user",
        entity_id=str(owner_id),
        organization_id=None,
    )

    global_response = client.get("/api/v1/activity", headers=auth_headers(member_token))
    org_response = client.get(f"/api/v1/activity?organization_id={organization['id']}", headers=auth_headers(member_token))
    self_actor_response = client.get(f"/api/v1/activity?actor_user_id={member_id}", headers=auth_headers(member_token))
    other_user_response = client.get(f"/api/v1/activity/users/{owner_id}", headers=auth_headers(member_token))
    org_detail_response = client.get(f"/api/v1/activity/{org_activity_id}", headers=auth_headers(member_token))
    personal_detail_response = client.get(f"/api/v1/activity/{personal_activity_id}", headers=auth_headers(member_token))

    assert global_response.status_code == 403
    assert org_response.status_code == 403
    assert self_actor_response.status_code == 403
    assert other_user_response.status_code == 403
    assert org_detail_response.status_code == 403
    assert personal_detail_response.status_code == 403


def test_user_with_org_audit_permission_can_view_allowed_scope_but_not_unrelated_scope(client) -> None:
    create_test_user(client, email="platform-audit-owner@example.com", full_name="Platform Audit Owner")
    platform_token = get_auth_token(client, email="platform-audit-owner@example.com")
    platform_headers = auth_headers(platform_token)
    org_one = create_test_organization(client, platform_headers, name="Allowed Audit Org")
    org_two = create_test_organization(client, platform_headers, name="Denied Audit Org")
    create_test_user(client, email="org-auditor@example.com", full_name="Org Auditor")
    auditor_token = get_auth_token(client, email="org-auditor@example.com")

    with SessionLocal() as db:
        platform_owner = _user(db, "platform-audit-owner@example.com")
        auditor = _user(db, "org-auditor@example.com")
        _add_org_membership(db, user=auditor, organization_id=org_one["id"], member_role="auditor")
        _assign_role(db, user=auditor, role_key="organization_auditor", scope_type="organization", scope_id=org_one["id"], assigned_by=platform_owner.id)

    _log_activity(actor_email="platform-audit-owner@example.com", organization_id=org_one["id"], action="organization.updated", entity_id=str(org_one["id"]))
    _log_activity(actor_email="platform-audit-owner@example.com", organization_id=org_two["id"], action="organization.updated", entity_id=str(org_two["id"]))

    allowed = client.get(f"/api/v1/activity?organization_id={org_one['id']}", headers=auth_headers(auditor_token))
    denied = client.get(f"/api/v1/activity?organization_id={org_two['id']}", headers=auth_headers(auditor_token))

    assert allowed.status_code == 200
    assert {item["organization_id"] for item in allowed.json()} == {org_one["id"]}
    assert denied.status_code == 403


def test_superuser_can_view_platform_and_global_audit_logs(client) -> None:
    create_test_user(client, email="audit-superuser@example.com", full_name="Audit Superuser")
    token = get_auth_token(client, email="audit-superuser@example.com")
    activity_id = _log_activity(
        actor_email="audit-superuser@example.com",
        action="platform.certification",
        entity_type="platform",
        entity_id=None,
        description="Platform audit event",
    )

    response = client.get("/api/v1/activity", headers=auth_headers(token))
    detail = client.get(f"/api/v1/activity/{activity_id}", headers=auth_headers(token))

    assert response.status_code == 200
    assert any(item["id"] == activity_id for item in response.json())
    assert detail.status_code == 200
    assert detail.json()["action"] == "platform.certification"


def test_audit_log_creation_listing_ordering_filtering_and_pagination(client) -> None:
    create_test_user(client, email="audit-list-owner@example.com", full_name="Audit List Owner")
    token = get_auth_token(client, email="audit-list-owner@example.com")
    headers = auth_headers(token)
    organization = create_test_organization(client, headers, name="Audit Listing Org")

    first_id = _log_activity(
        actor_email="audit-list-owner@example.com",
        organization_id=organization["id"],
        action="organization.created",
        entity_type="organization",
        entity_id=str(organization["id"]),
        description="Older organization event",
        metadata={"source": "certification"},
    )
    second_id = _log_activity(
        actor_email="audit-list-owner@example.com",
        organization_id=organization["id"],
        action="role.assigned",
        entity_type="role_assignment",
        entity_id="42",
        description="Newer role assignment event",
        metadata={"scope_type": "organization"},
    )

    with SessionLocal() as db:
        first = db.get(ActivityLog, first_id)
        second = db.get(ActivityLog, second_id)
        assert first is not None and second is not None
        first.created_at = datetime.now(timezone.utc) - timedelta(days=1)
        second.created_at = datetime.now(timezone.utc)
        db.commit()

    all_logs = client.get(f"/api/v1/activity?organization_id={organization['id']}", headers=headers)
    role_logs = client.get(f"/api/v1/activity?organization_id={organization['id']}&action=role.assigned", headers=headers)
    entity_logs = client.get(f"/api/v1/activity?organization_id={organization['id']}&entity_type=role_assignment", headers=headers)
    paged_logs = client.get(f"/api/v1/activity?organization_id={organization['id']}&limit=1&offset=1", headers=headers)

    assert all_logs.status_code == 200
    assert [item["id"] for item in all_logs.json()[:2]] == [second_id, first_id]
    assert role_logs.status_code == 200
    assert [item["id"] for item in role_logs.json()] == [second_id]
    assert entity_logs.status_code == 200
    assert [item["id"] for item in entity_logs.json()] == [second_id]
    assert paged_logs.status_code == 200
    assert len(paged_logs.json()) == 1
    assert paged_logs.json()[0]["id"] == first_id
    assert all_logs.json()[0]["event_metadata"] == {"scope_type": "organization"}


def test_audit_log_read_and_create_do_not_mutate_role_assignments(client) -> None:
    create_test_user(client, email="audit-safe-owner@example.com", full_name="Audit Safe Owner")
    token = get_auth_token(client, email="audit-safe-owner@example.com")
    headers = auth_headers(token)
    organization = create_test_organization(client, headers, name="Audit Safety Org")

    with SessionLocal() as db:
        before_assignments = db.query(RoleAssignment).count()

    activity_id = _log_activity(
        actor_email="audit-safe-owner@example.com",
        organization_id=organization["id"],
        action="audit.certification",
        entity_type="audit_event",
        entity_id="certification",
        description="Audit certification safety event",
    )
    list_response = client.get(f"/api/v1/activity?organization_id={organization['id']}", headers=headers)
    detail_response = client.get(f"/api/v1/activity/{activity_id}", headers=headers)

    assert list_response.status_code == 200
    assert detail_response.status_code == 200
    with SessionLocal() as db:
        assert db.query(RoleAssignment).count() == before_assignments


def test_user_can_view_own_personal_activity_without_audit_permission(client) -> None:
    create_test_user(client, email="personal-owner@example.com", full_name="Personal Owner")
    owner_token = get_auth_token(client, email="personal-owner@example.com")
    organization = create_test_organization(client, auth_headers(owner_token), name="Personal Activity Org")
    create_test_user(client, email="personal-activity@example.com", full_name="Personal Activity")
    token = get_auth_token(client, email="personal-activity@example.com")
    user_id = client.get("/api/v1/auth/me", headers=auth_headers(token)).json()["id"]

    with SessionLocal() as db:
        personal_user = _user(db, "personal-activity@example.com")
        _add_org_membership(db, user=personal_user, organization_id=organization["id"])

    activity_id = _log_activity(
        actor_email="personal-activity@example.com",
        action="user.profile_updated",
        entity_type="user",
        entity_id=str(user_id),
        organization_id=None,
        description="Personal profile update",
    )
    scoped_activity_id = _log_activity(
        actor_email="personal-activity@example.com",
        action="organization.updated",
        entity_type="organization",
        entity_id=str(organization["id"]),
        organization_id=organization["id"],
        description="Scoped organization update",
    )

    response = client.get(f"/api/v1/activity/users/{user_id}", headers=auth_headers(token))
    detail = client.get(f"/api/v1/activity/{activity_id}", headers=auth_headers(token))
    scoped_detail = client.get(f"/api/v1/activity/{scoped_activity_id}", headers=auth_headers(token))

    assert response.status_code == 200
    returned_ids = {item["id"] for item in response.json()}
    assert activity_id in returned_ids
    assert scoped_activity_id not in returned_ids
    assert detail.status_code == 200
    assert scoped_detail.status_code == 403
