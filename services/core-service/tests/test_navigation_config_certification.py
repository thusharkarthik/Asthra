import pytest
from fastapi import HTTPException

from app.db.session import SessionLocal
from app.models.feature_flag import FeatureFlag
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.schemas.navigation import RoleNavigationConfigBatchUpdate, RoleNavigationConfigUpdateItem, RoleNavigationVisibility
from app.services.access_control_service import AccessControlService
from app.services.feature_flags import FeatureFlagService
from app.services.navigation_registry import NavigationRegistryService
from app.services.role_navigation_config import RoleNavigationConfigService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _create_role(db, *, name: str = "Navigation Certification Role", key: str = "navigation_certification_role", scope: str = "platform") -> Role:
    role = Role(
        organization_id=None,
        name=name,
        key=key,
        description="Role used by navigation certification tests.",
        scope=scope,
        is_system=False,
        is_editable=True,
        is_hidden=False,
        is_active=True,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _create_user(db, *, email: str = "navigation-cert-user@example.com", is_superuser: bool = False) -> User:
    user = User(
        email=email,
        full_name="Navigation Certification User",
        hashed_password="test",
        is_active=True,
        is_superuser=is_superuser,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _keys(navigation: dict, mode: str) -> set[str]:
    return {item["nav_key"] for item in navigation["modes"][mode]["items"]}


def test_navigation_config_certification_feature_flag_default_false() -> None:
    with SessionLocal() as db:
        FeatureFlagService(db).ensure_default_flags()
        flag = db.query(FeatureFlag).filter(FeatureFlag.flag_key == "core.navigation_config.enabled").one()

    assert flag.default_enabled is False
    assert flag.is_active is True


def test_navigation_registry_certification_items_have_required_shape() -> None:
    with SessionLocal() as db:
        items = NavigationRegistryService(db).get_registry()

    assert items
    assert {"platform", "org", "work", "settings"}.issubset({item.mode for item in items})
    keys = {item.nav_key for item in items}
    assert "platform.organizations" in keys
    assert "organization.members" in keys
    assert "work.flow" in keys
    for item in items:
        assert item.nav_key
        assert item.label
        assert item.route.startswith("/")
        assert item.mode
        assert item.group
        assert isinstance(item.order, int)
        assert isinstance(item.required_any_permissions, tuple)


def test_role_navigation_config_certification_persists_update_and_default_reset() -> None:
    with SessionLocal() as db:
        role = _create_role(db)
        service = RoleNavigationConfigService(db)

        created = service.upsert_role_config(
            RoleNavigationConfigBatchUpdate(
                role_id=role.id,
                mode="organization",
                items=[
                    RoleNavigationConfigUpdateItem(
                        nav_key="organization.members",
                        visibility=RoleNavigationVisibility.hidden,
                        order_override=42,
                    )
                ],
            )
        )
        assert created["mode"] == "org"
        assert created["items"][0].visibility == "hidden"
        assert created["items"][0].order_override == 42

        reset = service.upsert_role_config(
            RoleNavigationConfigBatchUpdate(
                role_id=role.id,
                mode="org",
                items=[RoleNavigationConfigUpdateItem(nav_key="organization.members", visibility=RoleNavigationVisibility.default)],
            )
        )

    assert reset["items"][0].visibility == "default"
    assert reset["items"][0].order_override is None


def test_role_navigation_config_certification_rejects_invalid_inputs(client) -> None:
    create_test_user(client, email="nav-cert-owner@example.com")
    token = get_auth_token(client, email="nav-cert-owner@example.com")
    headers = auth_headers(token)
    with SessionLocal() as db:
        role = _create_role(db, name="Navigation Validation Role", key="navigation_validation_role")
        service = RoleNavigationConfigService(db)
        with pytest.raises(HTTPException) as invalid_role:
            service.get_role_config(999999, "platform")
        with pytest.raises(HTTPException) as invalid_mode:
            service.get_role_config(role.id, "sidebar")
        with pytest.raises(HTTPException) as invalid_key:
            service.upsert_role_config(
                RoleNavigationConfigBatchUpdate(
                    role_id=role.id,
                    mode="platform",
                    items=[RoleNavigationConfigUpdateItem(nav_key="platform.nope")],
                )
            )

    assert invalid_role.value.status_code == 404
    assert invalid_mode.value.status_code == 422
    assert invalid_key.value.status_code == 422

    invalid_visibility = client.put(
        "/api/v1/navigation/role-config",
        json={
            "role_id": role.id,
            "mode": "platform",
            "items": [{"nav_key": "platform.organizations", "visibility": "always_visible"}],
        },
        headers=headers,
    )
    assert invalid_visibility.status_code == 422


def test_role_navigation_config_certification_preview_metadata_reflects_saved_config(client) -> None:
    create_test_user(client, email="nav-cert-preview-owner@example.com")
    token = get_auth_token(client, email="nav-cert-preview-owner@example.com")
    headers = auth_headers(token)
    with SessionLocal() as db:
        role = _create_role(db, name="Navigation Preview Role", key="navigation_preview_role")

    hidden = client.put(
        "/api/v1/navigation/role-config",
        json={
            "role_id": role.id,
            "mode": "org",
            "items": [{"nav_key": "organization.members", "visibility": "hidden"}],
        },
        headers=headers,
    )
    assert hidden.status_code == 200
    preview = client.get(f"/api/v1/navigation/role-config/preview?role_id={role.id}&mode=org", headers=headers)
    assert preview.status_code == 200
    hidden_item = next(item for item in preview.json()["items"] if item["nav_key"] == "organization.members")
    assert hidden_item["preview_visibility"] == "hidden"

    locked = client.put(
        "/api/v1/navigation/role-config",
        json={
            "role_id": role.id,
            "mode": "org",
            "items": [{"nav_key": "organization.members", "visibility": "show_locked_if_denied"}],
        },
        headers=headers,
    )
    assert locked.status_code == 200
    locked_preview = client.get(f"/api/v1/navigation/role-config/preview?role_id={role.id}&mode=org", headers=headers)
    locked_item = next(item for item in locked_preview.json()["items"] if item["nav_key"] == "organization.members")
    assert locked_item["preview_visibility"] == "show_locked_if_denied"
    assert "settings.member.view" in locked_item["required_any_permissions"]


def test_role_navigation_config_certification_does_not_change_live_navigation_or_grant_permissions() -> None:
    with SessionLocal() as db:
        user = _create_user(db)
        role = _create_role(db, name="No Grant Role", key="no_grant_role")
        db.add(RoleAssignment(user_id=user.id, role_id=role.id, scope_type="platform", scope_id=None, status="active"))
        db.commit()

        access = AccessControlService(db)
        before_permissions = set(access.get_user_permissions(user.id, "platform", None)["permission_codes"])
        before_navigation = NavigationRegistryService(db).resolve_navigation_for_context(user, scope_type="platform", scope_id=None)

        RoleNavigationConfigService(db).upsert_role_config(
            RoleNavigationConfigBatchUpdate(
                role_id=role.id,
                mode="platform",
                items=[
                    RoleNavigationConfigUpdateItem(
                        nav_key="platform.organizations",
                        visibility=RoleNavigationVisibility.show_locked_if_denied,
                    )
                ],
            )
        )

        after_permissions = set(access.get_user_permissions(user.id, "platform", None)["permission_codes"])
        after_navigation = NavigationRegistryService(db).resolve_navigation_for_context(user, scope_type="platform", scope_id=None)

    assert "settings.organization.view" not in before_permissions
    assert "settings.organization.view" not in after_permissions
    assert before_permissions == after_permissions
    assert before_navigation == after_navigation
    assert "platform.organizations" not in _keys(after_navigation, "platform")


def test_role_navigation_config_certification_live_resolver_ignores_config_even_for_superuser() -> None:
    with SessionLocal() as db:
        user = _create_user(db, email="nav-cert-super@example.com", is_superuser=True)
        role = _create_role(db, name="Superuser Hidden Config Role", key="superuser_hidden_config_role")
        before = NavigationRegistryService(db).resolve_navigation_for_context(user, scope_type="platform", scope_id=None)
        RoleNavigationConfigService(db).upsert_role_config(
            RoleNavigationConfigBatchUpdate(
                role_id=role.id,
                mode="platform",
                items=[RoleNavigationConfigUpdateItem(nav_key="platform.organizations", visibility=RoleNavigationVisibility.hidden)],
            )
        )
        after = NavigationRegistryService(db).resolve_navigation_for_context(user, scope_type="platform", scope_id=None)

    assert "platform.organizations" in _keys(before, "platform")
    assert "platform.organizations" in _keys(after, "platform")
    assert before == after
