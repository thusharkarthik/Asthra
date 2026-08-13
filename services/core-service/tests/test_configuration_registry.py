from fastapi import HTTPException
from app.db.session import SessionLocal
from app.models.configuration import ConfigurationDefinition
from app.models.organization import Organization
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace
from app.services.configuration_registry import ConfigurationRegistryService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _create_superuser() -> User:
    with SessionLocal() as db:
        user = User(
            email="config-superuser@example.com",
            full_name="Config Superuser",
            hashed_password="test",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _create_scope_tree(user: User) -> tuple[int, int, int]:
    with SessionLocal() as db:
        org = Organization(name="Acme", slug="acme", description="Test", created_by_id=user.id, is_active=True)
        db.add(org)
        db.flush()
        workspace = Workspace(name="Engineering", slug="engineering", organization_id=org.id, created_by_id=user.id, is_active=True)
        db.add(workspace)
        db.flush()
        project = Project(
            name="Platform",
            key="PLAT",
            workspace_id=workspace.id,
            description="Test project",
            created_by_id=user.id,
            is_active=True,
            status="active",
        )
        db.add(project)
        db.commit()
        return org.id, workspace.id, project.id


def test_default_configuration_definitions_seed_idempotently() -> None:
    with SessionLocal() as db:
        service = ConfigurationRegistryService(db)
        service.ensure_default_definitions()
        first_count = db.query(ConfigurationDefinition).count()
        service.ensure_default_definitions()
        second_count = db.query(ConfigurationDefinition).count()

    assert first_count >= 15
    assert second_count == first_count


def test_effective_configuration_returns_default_value() -> None:
    with SessionLocal() as db:
        effective = ConfigurationRegistryService(db).get_effective_configuration("platform", None)

    item = effective["configuration"]["flow.default_sprint_length_days"]
    assert item["value"] == 14
    assert item["inherited_from"] == "default"


def test_platform_and_organization_overrides_inherit_correctly() -> None:
    user = _create_superuser()
    org_id, _, _ = _create_scope_tree(user)
    with SessionLocal() as db:
        actor = db.get(User, user.id)
        service = ConfigurationRegistryService(db)
        service.set_configuration_value(
            config_key="flow.default_sprint_length_days",
            scope_type="platform",
            scope_id=None,
            value=10,
            actor=actor,
        )
        service.set_configuration_value(
            config_key="flow.default_sprint_length_days",
            scope_type="organization",
            scope_id=org_id,
            value=7,
            actor=actor,
        )
        effective = service.get_effective_configuration("organization", org_id)

    item = effective["configuration"]["flow.default_sprint_length_days"]
    assert item["value"] == 7
    assert item["inherited_from"] == "organization"


def test_workspace_and_project_overrides_inherit_correctly() -> None:
    user = _create_superuser()
    _, workspace_id, project_id = _create_scope_tree(user)
    with SessionLocal() as db:
        actor = db.get(User, user.id)
        service = ConfigurationRegistryService(db)
        service.set_configuration_value(
            config_key="flow.default_sprint_length_days",
            scope_type="workspace",
            scope_id=workspace_id,
            value=5,
            actor=actor,
        )
        service.set_configuration_value(
            config_key="flow.default_sprint_length_days",
            scope_type="project",
            scope_id=project_id,
            value=21,
            actor=actor,
        )
        effective = service.get_effective_configuration("project", project_id)

    item = effective["configuration"]["flow.default_sprint_length_days"]
    assert item["value"] == 21
    assert item["inherited_from"] == "project"


def test_invalid_configuration_values_are_rejected() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        actor = db.get(User, user.id)
        service = ConfigurationRegistryService(db)
        try:
            service.set_configuration_value(
                config_key="core.allow_self_serve_org_creation",
                scope_type="platform",
                scope_id=None,
                value="yes",
                actor=actor,
            )
        except HTTPException as exc:
            assert exc.status_code == 422
        else:
            raise AssertionError("Expected invalid boolean value to be rejected.")


def test_secret_configuration_values_are_redacted() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        db.add(
            ConfigurationDefinition(
                config_key="core.secret_token",
                name="Secret Token",
                description="Test secret",
                category="core",
                source_module="core",
                value_type="string",
                default_value="hidden",
                is_secret=True,
                is_system=True,
                is_active=True,
                supports_inheritance=True,
            )
        )
        db.commit()
        effective = ConfigurationRegistryService(db).get_effective_configuration("platform", None)

    assert effective["configuration"]["core.secret_token"]["value"] is None


def test_configuration_api_authorization_and_effective_config(client) -> None:
    create_test_user(client, email="config-owner@example.com")
    owner_token = get_auth_token(client, email="config-owner@example.com")
    create_test_user(client, email="config-member@example.com")
    member_token = get_auth_token(client, email="config-member@example.com")

    denied = client.put(
        "/api/v1/configuration/values",
        json={"config_key": "flow.default_sprint_length_days", "scope_type": "platform", "value": 9},
        headers=auth_headers(member_token),
    )
    assert denied.status_code == 403

    allowed = client.put(
        "/api/v1/configuration/values",
        json={"config_key": "flow.default_sprint_length_days", "scope_type": "platform", "value": 9},
        headers=auth_headers(owner_token),
    )
    assert allowed.status_code == 200

    effective = client.get("/api/v1/configuration/effective", headers=auth_headers(owner_token))
    assert effective.status_code == 200
    assert effective.json()["configuration"]["flow.default_sprint_length_days"]["value"] == 9


def test_platform_context_includes_configuration_metadata(client) -> None:
    create_test_user(client, email="config-platform@example.com")
    token = get_auth_token(client, email="config-platform@example.com")

    response = client.get("/api/v1/context/platform", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.json()
    assert payload["configuration"]["available"] is True
    assert payload["configuration"]["endpoint"] == "/api/v1/configuration/effective"
    assert "core" in payload["configuration"]["categories"]
