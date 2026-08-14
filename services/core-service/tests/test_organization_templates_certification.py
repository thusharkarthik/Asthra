from __future__ import annotations

from app.db.session import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.configuration import ConfigurationDefinition, ConfigurationValue
from app.models.feature_flag import FeatureFlag, FeatureFlagOverride
from app.services.configuration_registry import ConfigurationRegistryService
from app.services.feature_flags import FeatureFlagService
from app.models.project import Project
from app.models.role import Role
from app.models.team import Team
from app.models.user import RoleAssignment, User, UserRole
from app.models.workspace import Workspace
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _headers(client, email: str, password: str = "password123") -> dict[str, str]:
    return auth_headers(get_auth_token(client, email=email, password=password))


def _bootstrap_platform_owner(client, *, email: str = "template-platform@example.com") -> dict[str, str]:
    create_test_user(client, email=email, password="password123", full_name="Template Platform")
    return _headers(client, email)


def _create_user(client, email: str, *, full_name: str | None = None) -> dict[str, str]:
    create_test_user(client, email=email, password="password123", full_name=full_name or email.split("@")[0].title())
    return _headers(client, email)


def _create_org_owner(client, email: str, name: str) -> tuple[dict[str, str], dict]:
    headers = _create_user(client, email)
    response = client.post(
        "/api/v1/organizations/onboard",
        json={"name": name, "description": "Organization template certification org"},
        headers=headers,
    )
    assert response.status_code == 201
    return headers, response.json()


def _counts(org_id: int) -> dict[str, int]:
    with SessionLocal() as db:
        workspace_ids = [row.id for row in db.query(Workspace).filter(Workspace.organization_id == org_id).all()]
        project_count = db.query(Project).filter(Project.workspace_id.in_(workspace_ids)).count() if workspace_ids else 0
        team_count = db.query(Team).filter(Team.workspace_id.in_(workspace_ids)).count() if workspace_ids else 0
        return {
            "workspaces": len(workspace_ids),
            "projects": project_count,
            "teams": team_count,
            "feature_overrides": db.query(FeatureFlagOverride).filter(
                FeatureFlagOverride.scope_type == "organization",
                FeatureFlagOverride.scope_id == org_id,
            ).count(),
            "config_values": db.query(ConfigurationValue).filter(
                ConfigurationValue.scope_type == "organization",
                ConfigurationValue.scope_id == org_id,
            ).count(),
            "activities": db.query(ActivityLog).filter(
                ActivityLog.organization_id == org_id,
                ActivityLog.action == "organization.template_applied",
            ).count(),
            "role_assignments": db.query(RoleAssignment).count(),
            "user_roles": db.query(UserRole).count(),
        }


def _user_id(email: str) -> int:
    with SessionLocal() as db:
        return db.query(User.id).filter(User.email == email).scalar()


def _assign_role_to_user(email: str, role_key: str, scope_type: str, scope_id: int | None) -> None:
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).one()
        role = db.query(Role).filter(Role.key == role_key, Role.is_active.is_(True)).one()
        db.add(RoleAssignment(
            user_id=user.id,
            role_id=role.id,
            scope_type=scope_type,
            scope_id=scope_id,
            status="active",
            assigned_by=user.id,
        ))
        db.commit()


def test_organization_template_endpoints_require_authentication(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)
    _, org = _create_org_owner(client, "template-auth-owner@example.com", "Template Auth Org")

    detail = client.get("/api/v1/organization-templates/software_team", headers=platform_headers)
    assert detail.status_code == 200

    requests = [
        ("GET", "/api/v1/organization-templates", None),
        ("GET", "/api/v1/organization-templates/software_team", None),
        ("POST", "/api/v1/organization-templates/software_team/preview", {"organization_id": org["id"]}),
        ("POST", "/api/v1/organization-templates/software_team/apply", {"organization_id": org["id"]}),
    ]

    for method, url, payload in requests:
        response = client.request(method, url, json=payload)
        assert response.status_code in {401, 403}


def test_organization_template_view_and_apply_permissions_are_scoped(client) -> None:
    _bootstrap_platform_owner(client)
    owner_a_headers, org_a = _create_org_owner(client, "template-owner-a@example.com", "Template Owner A Org")
    owner_b_headers, org_b = _create_org_owner(client, "template-owner-b@example.com", "Template Owner B Org")
    member_headers = _create_user(client, "template-no-access@example.com")

    platform_list_as_member = client.get("/api/v1/organization-templates", headers=member_headers)
    platform_list_as_org_owner = client.get("/api/v1/organization-templates", headers=owner_a_headers)
    own_scoped_list = client.get(f"/api/v1/organization-templates?organization_id={org_a['id']}", headers=owner_a_headers)
    own_detail = client.get(f"/api/v1/organization-templates/software_team?organization_id={org_a['id']}", headers=owner_a_headers)
    unrelated_preview = client.post(
        "/api/v1/organization-templates/software_team/preview",
        json={"organization_id": org_b["id"]},
        headers=owner_a_headers,
    )
    unrelated_apply = client.post(
        "/api/v1/organization-templates/software_team/apply",
        json={"organization_id": org_b["id"]},
        headers=owner_a_headers,
    )
    no_access_apply = client.post(
        "/api/v1/organization-templates/software_team/apply",
        json={"organization_id": org_a["id"]},
        headers=member_headers,
    )
    owner_b_apply = client.post(
        "/api/v1/organization-templates/startup/apply",
        json={"organization_id": org_b["id"]},
        headers=owner_b_headers,
    )

    assert platform_list_as_member.status_code == 403
    assert platform_list_as_org_owner.status_code == 403
    assert own_scoped_list.status_code == 200
    assert own_detail.status_code == 200
    assert unrelated_preview.status_code == 403
    assert unrelated_apply.status_code == 403
    assert no_access_apply.status_code == 403
    assert owner_b_apply.status_code == 200


def test_organization_template_registry_detail_and_unknown_key(client) -> None:
    platform_headers = _bootstrap_platform_owner(client)

    catalog = client.get("/api/v1/organization-templates", headers=platform_headers)
    detail = client.get("/api/v1/organization-templates/software_team", headers=platform_headers)
    missing = client.get("/api/v1/organization-templates/not-real", headers=platform_headers)

    assert catalog.status_code == 200
    templates = catalog.json()["templates"]
    assert {template["template_key"] for template in templates} >= {
        "startup",
        "software_team",
        "healthcare",
        "support_desk",
        "agency",
        "enterprise_it",
    }
    assert detail.status_code == 200
    assert detail.json()["template_key"] == "software_team"
    assert detail.json()["category"] == "software"
    assert missing.status_code == 404


def test_organization_template_preview_is_non_mutating_and_reports_skips(client) -> None:
    _bootstrap_platform_owner(client)
    owner_headers, org = _create_org_owner(client, "template-preview-owner@example.com", "Template Preview Cert Org")

    before = _counts(org["id"])
    preview = client.post(
        "/api/v1/organization-templates/software_team/preview",
        json={"organization_id": org["id"]},
        headers=owner_headers,
    )
    after_preview = _counts(org["id"])

    assert preview.status_code == 200
    payload = preview.json()
    assert payload["summary"]["workspaces_to_create"] == 2
    assert payload["summary"]["projects_to_create"] == 5
    assert payload["summary"]["teams_to_create"] == 3
    assert after_preview == before

    apply = client.post(
        "/api/v1/organization-templates/software_team/apply",
        json={"organization_id": org["id"]},
        headers=owner_headers,
    )
    assert apply.status_code == 200

    skipped_preview = client.post(
        "/api/v1/organization-templates/software_team/preview",
        json={"organization_id": org["id"]},
        headers=owner_headers,
    )
    assert skipped_preview.status_code == 200
    assert skipped_preview.json()["summary"]["skipped_existing"] >= 10
    assert all(
        action["status"] in {"skipped_existing", "pending"}
        for action in skipped_preview.json()["actions"]
    )


def test_organization_template_apply_creates_core_records_idempotently_and_only_target_org(client) -> None:
    _bootstrap_platform_owner(client)
    owner_a_headers, org_a = _create_org_owner(client, "template-apply-a@example.com", "Template Apply A Org")
    _, org_b = _create_org_owner(client, "template-apply-b@example.com", "Template Apply B Org")
    before_a = _counts(org_a["id"])
    before_b = _counts(org_b["id"])

    first = client.post(
        "/api/v1/organization-templates/software_team/apply",
        json={"organization_id": org_a["id"]},
        headers=owner_a_headers,
    )
    second = client.post(
        "/api/v1/organization-templates/software_team/apply",
        json={"organization_id": org_a["id"]},
        headers=owner_a_headers,
    )
    after_a = _counts(org_a["id"])
    after_b = _counts(org_b["id"])

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["summary"]["workspaces_to_create"] == 2
    assert first.json()["summary"]["projects_to_create"] == 5
    assert first.json()["summary"]["teams_to_create"] == 3
    assert second.json()["summary"]["skipped_existing"] >= 10
    assert after_a["workspaces"] == before_a["workspaces"] + 2
    assert after_a["projects"] == before_a["projects"] + 5
    assert after_a["teams"] == before_a["teams"] + 3
    assert after_b == before_b

    with SessionLocal() as db:
        workspace_names = {row.name for row in db.query(Workspace).filter(Workspace.organization_id == org_a["id"]).all()}
        assert workspace_names >= {"Engineering", "Product"}


def test_organization_template_feature_flag_and_configuration_overrides_are_org_scoped(client) -> None:
    _bootstrap_platform_owner(client)
    owner_headers, org = _create_org_owner(client, "template-overrides-owner@example.com", "Template Overrides Org")
    _, unrelated_org = _create_org_owner(client, "template-overrides-other@example.com", "Template Overrides Other Org")

    with SessionLocal() as db:
        FeatureFlagService(db).ensure_default_flags()
        ConfigurationRegistryService(db).ensure_default_definitions()
        default_desk = db.query(FeatureFlag).filter(FeatureFlag.flag_key == "module.desk.enabled").one().default_enabled
        default_sla = db.query(ConfigurationDefinition).filter(ConfigurationDefinition.config_key == "desk.default_sla_hours").one().default_value

    response = client.post(
        "/api/v1/organization-templates/support_desk/apply",
        json={"organization_id": org["id"]},
        headers=owner_headers,
    )

    assert response.status_code == 200
    with SessionLocal() as db:
        desk_flag = db.query(FeatureFlagOverride).filter_by(
            flag_key="module.desk.enabled",
            scope_type="organization",
            scope_id=org["id"],
        ).one_or_none()
        unrelated_desk_flag = db.query(FeatureFlagOverride).filter_by(
            flag_key="module.desk.enabled",
            scope_type="organization",
            scope_id=unrelated_org["id"],
        ).one_or_none()
        sla_config = db.query(ConfigurationValue).filter_by(
            config_key="desk.default_sla_hours",
            scope_type="organization",
            scope_id=org["id"],
        ).one_or_none()
        unrelated_sla_config = db.query(ConfigurationValue).filter_by(
            config_key="desk.default_sla_hours",
            scope_type="organization",
            scope_id=unrelated_org["id"],
        ).one_or_none()
        assert db.query(FeatureFlag).filter(FeatureFlag.flag_key == "module.desk.enabled").one().default_enabled == default_desk
        assert db.query(ConfigurationDefinition).filter(ConfigurationDefinition.config_key == "desk.default_sla_hours").one().default_value == default_sla

    assert desk_flag is not None and desk_flag.enabled is True
    assert unrelated_desk_flag is None
    assert sla_config is not None and sla_config.value == 4
    assert unrelated_sla_config is None


def test_organization_admin_role_assignment_sees_assigned_org_descendants_and_templates(client) -> None:
    _bootstrap_platform_owner(client)
    owner_a_headers, org_a = _create_org_owner(client, "template-org-admin-owner-a@example.com", "Template Org Admin A")
    owner_b_headers, org_b = _create_org_owner(client, "template-org-admin-owner-b@example.com", "Template Org Admin B")

    apply_a = client.post(
        "/api/v1/organization-templates/software_team/apply",
        json={"organization_id": org_a["id"]},
        headers=owner_a_headers,
    )
    apply_b = client.post(
        "/api/v1/organization-templates/startup/apply",
        json={"organization_id": org_b["id"]},
        headers=owner_b_headers,
    )
    assert apply_a.status_code == 200
    assert apply_b.status_code == 200

    admin_email = "template-org-admin@example.com"
    admin_headers = _create_user(client, admin_email)
    before_role_assignments = _counts(org_a["id"])["role_assignments"]
    before_user_roles = _counts(org_a["id"])["user_roles"]
    _assign_role_to_user(admin_email, "organization_admin", "organization", org_a["id"])

    platform_context = client.get("/api/v1/context/platform", headers=admin_headers)
    scoped_context = client.get(f"/api/v1/context/platform?org_id={org_a['id']}", headers=admin_headers)
    workspaces = client.get("/api/v1/workspaces", headers=admin_headers)
    projects = client.get("/api/v1/projects", headers=admin_headers)
    scoped_templates = client.get(f"/api/v1/organization-templates?organization_id={org_a['id']}", headers=admin_headers)
    platform_templates = client.get("/api/v1/organization-templates", headers=admin_headers)
    unrelated_templates = client.get(f"/api/v1/organization-templates?organization_id={org_b['id']}", headers=admin_headers)

    assert platform_context.status_code == 200
    assert scoped_context.status_code == 200
    assert workspaces.status_code == 200
    assert projects.status_code == 200
    assert scoped_templates.status_code == 200
    assert platform_templates.status_code == 403
    assert unrelated_templates.status_code == 403

    context_payload = platform_context.json()
    scoped_payload = scoped_context.json()
    visible_org_ids = {organization["id"] for organization in context_payload["organizations"]}
    visible_workspace_org_ids = {workspace["organization_id"] for workspace in workspaces.json()}
    visible_project_workspace_ids = {project["workspace_id"] for project in projects.json()}
    org_a_workspace_ids = {workspace["id"] for workspace in workspaces.json() if workspace["organization_id"] == org_a["id"]}

    assert org_a["id"] in visible_org_ids
    assert org_b["id"] not in visible_org_ids
    assert visible_workspace_org_ids == {org_a["id"]}
    assert visible_project_workspace_ids
    assert visible_project_workspace_ids <= org_a_workspace_ids
    assert scoped_payload["current_org"]["id"] == org_a["id"]
    assert {workspace["organization_id"] for workspace in scoped_payload["workspaces"]} == {org_a["id"]}
    assert "settings.organization_templates.view" in scoped_payload["permissions"]
    assert "settings.organization_templates.apply" in scoped_payload["permissions"]
    assert _counts(org_a["id"])["role_assignments"] == before_role_assignments + 1
    assert _counts(org_a["id"])["user_roles"] == before_user_roles

    no_access_headers = _create_user(client, "template-org-admin-no-access@example.com")
    no_access_context = client.get("/api/v1/context/platform", headers=no_access_headers)
    assert no_access_context.status_code == 200
    assert no_access_context.json()["organizations"] == []
    assert no_access_context.json()["workspaces"] == []
    assert no_access_context.json()["projects"] == []


def test_organization_template_apply_bumps_context_and_platform_context_reflects_resources(client) -> None:
    _bootstrap_platform_owner(client)
    owner_headers, org = _create_org_owner(client, "template-context-owner@example.com", "Template Context Org")

    before_version = client.get(f"/api/v1/context/version?organization_id={org['id']}", headers=owner_headers)
    before_context = client.get(f"/api/v1/context/platform?org_id={org['id']}", headers=owner_headers)
    assert before_version.status_code == 200
    assert before_context.status_code == 200

    apply = client.post(
        "/api/v1/organization-templates/startup/apply",
        json={"organization_id": org["id"]},
        headers=owner_headers,
    )
    after_version = client.get(f"/api/v1/context/version?organization_id={org['id']}", headers=owner_headers)
    after_context = client.get(f"/api/v1/context/platform?org_id={org['id']}", headers=owner_headers)

    assert apply.status_code == 200
    assert after_version.status_code == 200
    assert after_context.status_code == 200
    assert after_version.json()["organization_version"] > before_version.json()["organization_version"]
    assert len(after_context.json()["workspaces"]) > len(before_context.json()["workspaces"])
    assert after_context.json()["organization_templates"]["available"] is True


def test_organization_template_apply_does_not_grant_roles_or_use_user_roles(client) -> None:
    _bootstrap_platform_owner(client)
    owner_headers, org = _create_org_owner(client, "template-rbac-owner@example.com", "Template RBAC Org")
    owner_id = _user_id("template-rbac-owner@example.com")

    before = _counts(org["id"])
    before_owner_permissions = client.get(f"/api/v1/me/permissions?org_id={org['id']}", headers=owner_headers).json()["permission_codes"]

    response = client.post(
        "/api/v1/organization-templates/software_team/apply",
        json={"organization_id": org["id"]},
        headers=owner_headers,
    )

    assert response.status_code == 200
    after = _counts(org["id"])
    after_owner_permissions = client.get(f"/api/v1/me/permissions?org_id={org['id']}", headers=owner_headers).json()["permission_codes"]
    with SessionLocal() as db:
        owner_assignments = db.query(RoleAssignment).filter(RoleAssignment.user_id == owner_id).count()

    assert after["role_assignments"] == before["role_assignments"]
    assert after["user_roles"] == before["user_roles"]
    assert set(after_owner_permissions) == set(before_owner_permissions)
    assert owner_assignments >= 1


def test_organization_template_apply_writes_activity_for_template_and_created_resources(client) -> None:
    _bootstrap_platform_owner(client)
    owner_headers, org = _create_org_owner(client, "template-audit-owner@example.com", "Template Audit Org")

    response = client.post(
        "/api/v1/organization-templates/startup/apply",
        json={"organization_id": org["id"]},
        headers=owner_headers,
    )

    assert response.status_code == 200
    with SessionLocal() as db:
        actions = [row.action for row in db.query(ActivityLog).filter(ActivityLog.organization_id == org["id"]).all()]

    assert "organization.template_applied" in actions
    assert "workspace.created" in actions
    assert "project.created" in actions
    assert "team.created" in actions
