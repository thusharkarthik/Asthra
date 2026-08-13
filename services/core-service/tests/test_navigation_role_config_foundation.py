import pytest
from fastapi import HTTPException

from app.db.session import SessionLocal
from app.models.feature_flag import FeatureFlag
from app.models.role import Role
from app.models.user import User
from app.schemas.navigation import RoleNavigationConfigBatchUpdate, RoleNavigationConfigUpdateItem, RoleNavigationVisibility
from app.services.feature_flags import FeatureFlagService
from app.services.navigation_registry import NavigationRegistryService
from app.services.role_navigation_config import RoleNavigationConfigService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _create_role(db, *, name: str = "Navigation Config Role", key: str = "navigation_config_role") -> Role:
    role = Role(
        organization_id=None,
        name=name,
        key=key,
        description="Role used by navigation config tests.",
        scope="platform",
        is_system=False,
        is_editable=True,
        is_hidden=False,
        is_active=True,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _create_superuser(email: str = "nav-config-superuser@example.com") -> User:
    with SessionLocal() as db:
        user = User(
            email=email,
            full_name="Navigation Config Superuser",
            hashed_password="test",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _keys(navigation: dict, mode: str) -> set[str]:
    return {item["nav_key"] for item in navigation["modes"][mode]["items"]}


def test_navigation_config_feature_flag_defaults_false() -> None:
    with SessionLocal() as db:
        service = FeatureFlagService(db)
        service.ensure_default_flags()
        flag = db.query(FeatureFlag).filter(FeatureFlag.flag_key == "core.navigation_config.enabled").one()

    assert flag.default_enabled is False
    assert flag.is_active is True


def test_role_navigation_config_create_update_and_read() -> None:
    with SessionLocal() as db:
        role = _create_role(db)
        service = RoleNavigationConfigService(db)

        created = service.upsert_role_config(
            RoleNavigationConfigBatchUpdate(
                role_id=role.id,
                mode="platform",
                items=[
                    RoleNavigationConfigUpdateItem(
                        nav_key="platform.organizations",
                        visibility=RoleNavigationVisibility.hidden,
                        order_override=5,
                        label_override="Companies",
                        group_override="Admin",
                    )
                ],
            )
        )
        assert created["items"][0].visibility == "hidden"
        assert created["items"][0].label_override == "Companies"

        updated = service.upsert_role_config(
            RoleNavigationConfigBatchUpdate(
                role_id=role.id,
                mode="platform",
                items=[
                    RoleNavigationConfigUpdateItem(
                        nav_key="platform.organizations",
                        visibility=RoleNavigationVisibility.show_when_allowed,
                        order_override=15,
                    )
                ],
            )
        )

    assert len(updated["items"]) == 1
    assert updated["items"][0].visibility == "show_when_allowed"
    assert updated["items"][0].order_override == 15
    assert updated["items"][0].label_override is None


def test_role_navigation_config_rejects_invalid_role() -> None:
    with SessionLocal() as db:
        service = RoleNavigationConfigService(db)
        with pytest.raises(HTTPException) as exc:
            service.get_role_config(9999, "platform")

    assert exc.value.status_code == 404


def test_role_navigation_config_rejects_invalid_nav_key() -> None:
    with SessionLocal() as db:
        role = _create_role(db, name="Invalid Nav Role", key="invalid_nav_role")
        service = RoleNavigationConfigService(db)
        with pytest.raises(HTTPException) as exc:
            service.upsert_role_config(
                RoleNavigationConfigBatchUpdate(
                    role_id=role.id,
                    mode="platform",
                    items=[RoleNavigationConfigUpdateItem(nav_key="platform.not_real")],
                )
            )

    assert exc.value.status_code == 422


def test_role_navigation_config_invalid_visibility_returns_422(client) -> None:
    create_test_user(client, email="owner@example.com")
    token = get_auth_token(client, email="owner@example.com")
    with SessionLocal() as db:
        role = _create_role(db, name="Invalid Visibility Role", key="invalid_visibility_role")

    response = client.put(
        "/api/v1/navigation/role-config",
        json={
            "role_id": role.id,
            "mode": "platform",
            "items": [{"nav_key": "platform.organizations", "visibility": "always"}],
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 422


def test_role_navigation_config_does_not_affect_live_navigation_resolver() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        role = _create_role(db, name="No Runtime Effect Role", key="no_runtime_effect_role")
        before = NavigationRegistryService(db).resolve_navigation_for_context(user)
        RoleNavigationConfigService(db).upsert_role_config(
            RoleNavigationConfigBatchUpdate(
                role_id=role.id,
                mode="platform",
                items=[
                    RoleNavigationConfigUpdateItem(
                        nav_key="platform.organizations",
                        visibility=RoleNavigationVisibility.hidden,
                    )
                ],
            )
        )
        after = NavigationRegistryService(db).resolve_navigation_for_context(user)

    assert "platform.organizations" in _keys(before, "platform")
    assert "platform.organizations" in _keys(after, "platform")
    assert before == after


def test_role_navigation_config_api_read_update_and_preview(client) -> None:
    create_test_user(client, email="owner@example.com")
    token = get_auth_token(client, email="owner@example.com")
    headers = auth_headers(token)
    with SessionLocal() as db:
        role = _create_role(db, name="API Config Role", key="api_config_role")

    update = client.put(
        "/api/v1/navigation/role-config",
        json={
            "role_id": role.id,
            "mode": "organization",
            "items": [
                {
                    "nav_key": "organization.members",
                    "visibility": "show_locked_if_denied",
                    "order_override": 7,
                    "label_override": "People",
                }
            ],
        },
        headers=headers,
    )
    assert update.status_code == 200
    assert update.json()["mode"] == "org"
    assert update.json()["items"][0]["visibility"] == "show_locked_if_denied"

    read = client.get(f"/api/v1/navigation/role-config?role_id={role.id}&mode=org", headers=headers)
    assert read.status_code == 200
    assert read.json()["items"][0]["nav_key"] == "organization.members"

    preview = client.get(f"/api/v1/navigation/role-config/preview?role_id={role.id}&mode=org", headers=headers)
    assert preview.status_code == 200
    preview_item = next(item for item in preview.json()["items"] if item["nav_key"] == "organization.members")
    assert preview_item["preview_label"] == "People"
    assert preview_item["preview_visibility"] == "show_locked_if_denied"


def test_role_navigation_config_requires_navigation_permission(client) -> None:
    create_test_user(client, email="owner@example.com")
    create_test_user(client, email="member@example.com")
    member_token = get_auth_token(client, email="member@example.com")
    with SessionLocal() as db:
        role = _create_role(db, name="Permission Gate Role", key="permission_gate_role")

    response = client.get(
        f"/api/v1/navigation/role-config?role_id={role.id}&mode=platform",
        headers=auth_headers(member_token),
    )

    assert response.status_code == 403
