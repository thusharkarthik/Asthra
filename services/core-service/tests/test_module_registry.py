from app.db.session import SessionLocal
from app.models.feature_flag import FeatureFlagOverride
from app.models.module_registry import ModuleRegistry
from app.models.user import User
from app.services.feature_flags import FeatureFlagService
from app.services.module_registry import ModuleRegistryService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _create_superuser() -> User:
    with SessionLocal() as db:
        user = User(
            email="module-superuser@example.com",
            full_name="Module Superuser",
            hashed_password="test",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _module_keys(modules: list[dict]) -> set[str]:
    return {module["module_key"] for module in modules}


def test_default_module_catalog_seeds_idempotently() -> None:
    with SessionLocal() as db:
        service = ModuleRegistryService(db)
        service.ensure_default_modules()
        first_count = db.query(ModuleRegistry).count()
        service.ensure_default_modules()
        second_count = db.query(ModuleRegistry).count()

    assert first_count >= 25
    assert second_count == first_count


def test_work_module_available_when_flag_and_permission_present() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        modules = ModuleRegistryService(db).resolve_modules_for_context(
            user,
            scope_type="platform",
            scope_id=None,
            navigation_mode="work",
        )

    keys = _module_keys(modules)
    assert "flow" in keys
    assert "docs" in keys
    assert "discover" in keys


def test_module_hidden_when_feature_flag_disabled() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        service = FeatureFlagService(db)
        service.ensure_default_flags()
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

        modules = ModuleRegistryService(db).resolve_modules_for_context(
            user,
            scope_type="platform",
            scope_id=None,
            navigation_mode="work",
        )

    assert "flow" not in _module_keys(modules)


def test_module_hidden_when_permission_missing() -> None:
    with SessionLocal() as db:
        user = User(
            email="module-member@example.com",
            full_name="Module Member",
            hashed_password="test",
            is_active=True,
            is_superuser=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)

        modules = ModuleRegistryService(db).resolve_modules_for_context(
            user,
            scope_type="platform",
            scope_id=None,
            navigation_mode="work",
        )

    keys = _module_keys(modules)
    assert "flow" not in keys
    assert "home" in keys


def test_modules_sorted_by_sort_order() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        modules = ModuleRegistryService(db).resolve_modules_for_context(
            user,
            scope_type="platform",
            scope_id=None,
            navigation_mode="work",
        )

    sort_orders = [module["sort_order"] for module in modules]
    assert sort_orders == sorted(sort_orders)


def test_available_modules_api_returns_authenticated_modules(client) -> None:
    create_test_user(client, email="modules-owner@example.com")
    token = get_auth_token(client, email="modules-owner@example.com")

    response = client.get(
        "/api/v1/modules/available?navigation_mode=work&scope_type=platform",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["navigation_mode"] == "work"
    assert "flow" in _module_keys(payload["modules"])
    assert "desk" not in _module_keys(payload["modules"])


def test_platform_context_includes_available_modules(client) -> None:
    create_test_user(client, email="modules-context@example.com")
    token = get_auth_token(client, email="modules-context@example.com")

    response = client.get("/api/v1/context/platform", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.json()
    assert payload["feature_flags"]["module.flow.enabled"] is True
    assert "modules" in payload
    assert "platform_home" in _module_keys(payload["modules"])
