from fastapi import HTTPException

from app.api.v1.context import get_platform_context
from app.api.v1 import organization_templates
from app.db.session import SessionLocal
from app.models.configuration import ConfigurationValue
from app.models.feature_flag import FeatureFlagOverride
from app.models.organization import Organization
from app.models.project import Project
from app.models.team import Team
from app.models.user import User
from app.models.workspace import Workspace
from app.services.organization_templates import OrganizationTemplateService


def _create_superuser(email: str = "template-superuser@example.com") -> User:
    with SessionLocal() as db:
        user = User(
            email=email,
            full_name="Template Superuser",
            hashed_password="test",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _create_user(email: str = "template-member@example.com") -> User:
    with SessionLocal() as db:
        user = User(
            email=email,
            full_name="Template Member",
            hashed_password="test",
            is_active=True,
            is_superuser=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _create_organization(user: User, name: str = "Template Org") -> int:
    with SessionLocal() as db:
        org = Organization(
            name=name,
            slug=name.lower().replace(" ", "-"),
            description="Template test organization",
            created_by_id=user.id,
            is_active=True,
        )
        db.add(org)
        db.commit()
        return org.id


def test_template_api_routes_are_registered() -> None:
    paths = {route.path for route in organization_templates.router.routes}

    assert "" in paths
    assert "/{template_key}" in paths
    assert "/{template_key}/preview" in paths
    assert "/{template_key}/apply" in paths


def test_template_catalog_and_detail_load() -> None:
    with SessionLocal() as db:
        service = OrganizationTemplateService(db)
        catalog = service.get_template_catalog()
        detail = service.get_template_detail("software_team")

    templates = catalog["templates"]
    assert len(templates) >= 5
    assert {template.template_key for template in templates} >= {"startup", "software_team", "support_desk"}
    assert detail.template_key == "software_team"
    assert detail.category == "software"


def test_invalid_template_key_returns_404() -> None:
    with SessionLocal() as db:
        try:
            OrganizationTemplateService(db).get_template_detail("not-real")
        except HTTPException as exc:
            assert exc.status_code == 404
        else:
            raise AssertionError("Expected missing template key to return 404.")


def test_template_preview_reports_actions_without_mutating() -> None:
    user = _create_superuser()
    org_id = _create_organization(user, "Template Preview Org")

    with SessionLocal() as db:
        actor = db.get(User, user.id)
        report = OrganizationTemplateService(db).preview_template_for_organization(org_id, "software_team", actor)
        workspace_count = db.query(Workspace).filter(Workspace.organization_id == org_id).count()

    assert report.summary.workspaces_to_create == 2
    assert report.summary.projects_to_create >= 4
    assert report.summary.teams_to_create == 3
    assert workspace_count == 0


def test_template_apply_creates_core_structures_and_is_idempotent() -> None:
    user = _create_superuser()
    org_id = _create_organization(user, "Template Apply Org")

    with SessionLocal() as db:
        actor = db.get(User, user.id)
        first = OrganizationTemplateService(db).apply_template_to_organization(org_id, "software_team", actor)
        second = OrganizationTemplateService(db).apply_template_to_organization(org_id, "software_team", actor)
        workspaces = db.query(Workspace).filter(Workspace.organization_id == org_id).all()
        workspace_ids = [workspace.id for workspace in workspaces]
        project_count = db.query(Project).filter(Project.workspace_id.in_(workspace_ids)).count()
        team_count = db.query(Team).filter(Team.workspace_id.in_(workspace_ids)).count()

    assert first.summary.workspaces_to_create == 2
    assert second.summary.skipped_existing >= 9
    assert {workspace.name for workspace in workspaces} >= {"Engineering", "Product"}
    assert project_count == 5
    assert team_count == 3


def test_template_apply_sets_feature_flags_and_configuration() -> None:
    user = _create_superuser()
    org_id = _create_organization(user, "Template Flags Org")

    with SessionLocal() as db:
        actor = db.get(User, user.id)
        report = OrganizationTemplateService(db).apply_template_to_organization(org_id, "support_desk", actor)
        desk_flag = (
            db.query(FeatureFlagOverride)
            .filter(
                FeatureFlagOverride.flag_key == "module.desk.enabled",
                FeatureFlagOverride.scope_type == "organization",
                FeatureFlagOverride.scope_id == org_id,
            )
            .one()
        )
        sla_config = (
            db.query(ConfigurationValue)
            .filter(
                ConfigurationValue.config_key == "desk.default_sla_hours",
                ConfigurationValue.scope_type == "organization",
                ConfigurationValue.scope_id == org_id,
            )
            .one()
        )

    assert report.summary.feature_flags_to_apply >= 1
    assert desk_flag.enabled is True
    assert sla_config.value == 4


def test_unauthorized_template_apply_is_rejected() -> None:
    owner = _create_superuser("template-owner@example.com")
    org_id = _create_organization(owner, "Template Auth Org")
    user = _create_user()

    with SessionLocal() as db:
        actor = db.get(User, user.id)
        try:
            OrganizationTemplateService(db).apply_template_to_organization(org_id, "startup", actor)
        except HTTPException as exc:
            assert exc.status_code == 403
        else:
            raise AssertionError("Expected unauthorized template apply to return 403.")


def test_platform_context_includes_organization_template_metadata() -> None:
    user = _create_superuser()

    with SessionLocal() as db:
        actor = db.get(User, user.id)
        payload = get_platform_context(org_id=None, workspace_id=None, project_id=None, db=db, current_user=actor)

    metadata = payload["organization_templates"]
    assert metadata["available"] is True
    assert metadata["endpoint"] == "/api/v1/organization-templates"
    assert metadata["template_count"] >= 5
    assert "software" in metadata["categories"]


def test_template_metadata_service_is_compact() -> None:
    with SessionLocal() as db:
        metadata = OrganizationTemplateService(db).get_template_metadata()

    assert metadata["available"] is True
    assert "endpoint" in metadata
    assert "templates" not in metadata
