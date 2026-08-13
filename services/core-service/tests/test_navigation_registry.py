from app.api.v1.context import get_platform_context
from app.db.session import SessionLocal
from app.models.feature_flag import FeatureFlagOverride
from app.models.user import User
from app.services.navigation_registry import NavigationRegistryService


def _create_superuser(email: str = "navigation-superuser@example.com") -> User:
    with SessionLocal() as db:
        user = User(
            email=email,
            full_name="Navigation Superuser",
            hashed_password="test",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _create_regular_user() -> User:
    with SessionLocal() as db:
        user = User(
            email="navigation-member@example.com",
            full_name="Navigation Member",
            hashed_password="test",
            is_active=True,
            is_superuser=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _keys(navigation: dict, mode: str) -> set[str]:
    return {item["nav_key"] for item in navigation["modes"][mode]["items"]}


def test_navigation_registry_loads_core_items() -> None:
    with SessionLocal() as db:
        items = NavigationRegistryService(db).get_registry()

    keys = {item.nav_key for item in items}
    assert "platform.organizations" in keys
    assert "organization.members" in keys
    assert "work.flow" in keys


def test_navigation_includes_item_when_permission_present() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        navigation = NavigationRegistryService(db).resolve_navigation_for_context(user)

    platform_keys = _keys(navigation, "platform")
    assert "platform.organizations" in platform_keys
    assert "platform.access_control" in platform_keys


def test_navigation_filters_item_when_permission_missing() -> None:
    user = _create_regular_user()
    with SessionLocal() as db:
        navigation = NavigationRegistryService(db).resolve_navigation_for_context(user)

    platform_keys = _keys(navigation, "platform")
    assert "platform.home" in platform_keys
    assert "platform.organizations" not in platform_keys
    assert "platform.access_control" not in platform_keys


def test_navigation_hides_module_when_feature_disabled() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        db.add(
            FeatureFlagOverride(
                flag_key="module.flow.enabled",
                scope_type="platform",
                scope_id=None,
                enabled=False,
                created_by=user.id,
            )
        )
        db.commit()

        navigation = NavigationRegistryService(db).resolve_navigation_for_context(user)

    work_keys = _keys(navigation, "work")
    assert "work.flow" not in work_keys
    assert "work.docs" in work_keys


def test_platform_context_includes_navigation() -> None:
    user = _create_superuser("navigation-context@example.com")

    with SessionLocal() as db:
        payload = get_platform_context(
            org_id=None,
            workspace_id=None,
            project_id=None,
            navigation_mode=None,
            db=db,
            current_user=user,
        )

    assert payload["navigation"]["version"] == 1
    assert "platform" in payload["navigation"]["modes"]
    assert "platform.organizations" in _keys(payload["navigation"], "platform")
