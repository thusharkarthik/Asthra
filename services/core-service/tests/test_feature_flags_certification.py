import pytest

from app.db.session import SessionLocal
from app.models.feature_flag import FeatureFlag, FeatureFlagOverride
from app.models.user import RoleAssignment
from app.services.feature_flags import FeatureFlagService
from tests.conftest import auth_headers, create_test_organization, create_test_user, get_auth_token


NAV_CONFIG_FLAG = "core.navigation_config.enabled"


def _permission_codes(client, token: str, query: str = "") -> set[str]:
    response = client.get(f"/api/v1/me/permissions{query}", headers=auth_headers(token))
    assert response.status_code == 200
    return set(response.json()["permission_codes"])


def test_certification_default_flags_include_navigation_config_disabled_and_idempotent() -> None:
    with SessionLocal() as db:
        service = FeatureFlagService(db)
        service.ensure_default_flags()
        first_count = db.query(FeatureFlag).count()
        service.ensure_default_flags()
        second_count = db.query(FeatureFlag).count()
        flag = db.query(FeatureFlag).filter(FeatureFlag.flag_key == NAV_CONFIG_FLAG).one()

    assert second_count == first_count
    assert flag.name == "Navigation Configuration"
    assert flag.category == "core"
    assert flag.default_enabled is False
    assert flag.is_system is True
    assert flag.is_active is True


def test_certification_effective_flags_fail_closed_for_unknown_and_inactive_flags() -> None:
    with SessionLocal() as db:
        service = FeatureFlagService(db)
        service.ensure_default_flags()
        assert service.is_feature_enabled("not.a.real.flag", "platform", None) is False

        flow_flag = db.query(FeatureFlag).filter(FeatureFlag.flag_key == "module.flow.enabled").one()
        flow_flag.is_active = False
        db.commit()

        assert service.is_feature_enabled("module.flow.enabled", "platform", None) is False


def test_certification_platform_and_organization_overrides_resolve_with_expected_precedence(client) -> None:
    create_test_user(client, email="flag-owner@example.com")
    token = get_auth_token(client, email="flag-owner@example.com")
    headers = auth_headers(token)
    org = create_test_organization(client, headers, name="Feature Flag QA")

    platform_default = client.get("/api/v1/feature-flags/effective", headers=headers)
    assert platform_default.status_code == 200
    assert platform_default.json()["feature_flags"][NAV_CONFIG_FLAG] is False

    platform_on = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": NAV_CONFIG_FLAG, "scope_type": "platform", "enabled": True, "reason": "certification"},
        headers=headers,
    )
    assert platform_on.status_code == 200

    org_off = client.put(
        "/api/v1/feature-flags/overrides",
        json={
            "flag_key": NAV_CONFIG_FLAG,
            "scope_type": "organization",
            "scope_id": org["id"],
            "enabled": False,
            "reason": "certification org precedence",
        },
        headers=headers,
    )
    assert org_off.status_code == 200

    platform_effective = client.get("/api/v1/feature-flags/effective", headers=headers)
    org_effective = client.get(
        f"/api/v1/feature-flags/effective?scope_type=organization&scope_id={org['id']}",
        headers=headers,
    )

    assert platform_effective.status_code == 200
    assert org_effective.status_code == 200
    assert platform_effective.json()["feature_flags"][NAV_CONFIG_FLAG] is True
    assert org_effective.json()["feature_flags"][NAV_CONFIG_FLAG] is False


def test_certification_feature_flag_management_requires_manage_permission(client) -> None:
    create_test_user(client, email="platform-owner@example.com")
    create_test_user(client, email="regular-member@example.com")
    owner_token = get_auth_token(client, email="platform-owner@example.com")
    member_token = get_auth_token(client, email="regular-member@example.com")

    catalog = client.get("/api/v1/feature-flags", headers=auth_headers(owner_token))
    assert catalog.status_code == 200
    assert any(flag["flag_key"] == NAV_CONFIG_FLAG for flag in catalog.json()["flags"])

    effective = client.get("/api/v1/feature-flags/effective", headers=auth_headers(member_token))
    assert effective.status_code == 200
    assert NAV_CONFIG_FLAG in effective.json()["feature_flags"]

    unauthorized_catalog = client.get("/api/v1/feature-flags", headers=auth_headers(member_token))
    assert unauthorized_catalog.status_code == 403

    unauthorized_override = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": NAV_CONFIG_FLAG, "scope_type": "platform", "enabled": True},
        headers=auth_headers(member_token),
    )
    assert unauthorized_override.status_code == 403


def test_certification_platform_context_exposes_effective_feature_flags(client) -> None:
    create_test_user(client, email="context-owner@example.com")
    token = get_auth_token(client, email="context-owner@example.com")
    headers = auth_headers(token)

    initial_context = client.get("/api/v1/context/platform", headers=headers)
    assert initial_context.status_code == 200
    assert initial_context.json()["feature_flags"][NAV_CONFIG_FLAG] is False
    assert "flow" in initial_context.json()["enabled_modules"]

    toggle = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": NAV_CONFIG_FLAG, "scope_type": "platform", "enabled": True},
        headers=headers,
    )
    assert toggle.status_code == 200

    updated_context = client.get("/api/v1/context/platform", headers=headers)
    assert updated_context.status_code == 200
    assert updated_context.json()["feature_flags"][NAV_CONFIG_FLAG] is True


def test_certification_toggling_feature_flag_does_not_grant_or_mutate_rbac(client) -> None:
    create_test_user(client, email="rbac-owner@example.com")
    create_test_user(client, email="rbac-member@example.com")
    owner_token = get_auth_token(client, email="rbac-owner@example.com")
    member_token = get_auth_token(client, email="rbac-member@example.com")

    before_owner_permissions = _permission_codes(client, owner_token)
    before_member_permissions = _permission_codes(client, member_token)
    with SessionLocal() as db:
        before_assignment_count = db.query(RoleAssignment).count()

    override = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": NAV_CONFIG_FLAG, "scope_type": "platform", "enabled": True, "reason": "certification no RBAC mutation"},
        headers=auth_headers(owner_token),
    )
    assert override.status_code == 200

    assert _permission_codes(client, owner_token) == before_owner_permissions
    assert _permission_codes(client, member_token) == before_member_permissions
    with SessionLocal() as db:
        assert db.query(RoleAssignment).count() == before_assignment_count
        assert db.query(FeatureFlagOverride).filter(FeatureFlagOverride.flag_key == NAV_CONFIG_FLAG).count() == 1


def test_certification_invalid_scope_and_unknown_flag_return_validation_errors(client) -> None:
    create_test_user(client, email="validation-owner@example.com")
    token = get_auth_token(client, email="validation-owner@example.com")
    headers = auth_headers(token)

    missing_scope_id = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": NAV_CONFIG_FLAG, "scope_type": "organization", "enabled": True},
        headers=headers,
    )
    assert missing_scope_id.status_code == 422

    unknown_flag = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": "missing.flag.enabled", "scope_type": "platform", "enabled": True},
        headers=headers,
    )
    assert unknown_flag.status_code == 404
