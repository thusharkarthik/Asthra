from app.db.session import SessionLocal
from app.models.feature_flag import FeatureFlag
from app.services.feature_flags import FeatureFlagService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def test_default_flags_seed_idempotently() -> None:
    with SessionLocal() as db:
        service = FeatureFlagService(db)
        service.ensure_default_flags()
        first_count = db.query(FeatureFlag).count()
        service.ensure_default_flags()
        second_count = db.query(FeatureFlag).count()

    assert first_count >= 15
    assert second_count == first_count


def test_effective_flags_resolve_defaults() -> None:
    with SessionLocal() as db:
        flags = FeatureFlagService(db).get_effective_feature_flags("platform", None)

    assert flags["feature_flags"]["module.flow.enabled"] is True
    assert flags["feature_flags"]["module.docs.enabled"] is True
    assert flags["feature_flags"]["module.desk.enabled"] is False
    assert "flow" in flags["enabled_modules"]
    assert "desk" not in flags["enabled_modules"]


def test_platform_override_changes_effective_flag(client) -> None:
    create_test_user(client, email="owner@example.com")
    token = get_auth_token(client, email="owner@example.com")

    response = client.put(
        "/api/v1/feature-flags/overrides",
        json={
            "flag_key": "module.desk.enabled",
            "scope_type": "platform",
            "enabled": True,
            "reason": "QA enablement",
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 200

    effective = client.get("/api/v1/feature-flags/effective", headers=auth_headers(token))
    assert effective.status_code == 200
    assert effective.json()["feature_flags"]["module.desk.enabled"] is True
    assert "desk" in effective.json()["enabled_modules"]


def test_organization_override_precedes_platform_override(client) -> None:
    create_test_user(client, email="owner@example.com")
    token = get_auth_token(client, email="owner@example.com")
    headers = auth_headers(token)
    org_response = client.post(
        "/api/v1/organizations",
        json={"name": "Acme", "description": "Test"},
        headers=headers,
    )
    assert org_response.status_code == 201
    org_id = org_response.json()["id"]

    platform_override = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": "module.discover.enabled", "scope_type": "platform", "enabled": False},
        headers=headers,
    )
    assert platform_override.status_code == 200
    org_override = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": "module.discover.enabled", "scope_type": "organization", "scope_id": org_id, "enabled": True},
        headers=headers,
    )
    assert org_override.status_code == 200

    platform_effective = client.get("/api/v1/feature-flags/effective", headers=headers)
    org_effective = client.get(
        f"/api/v1/feature-flags/effective?scope_type=organization&scope_id={org_id}",
        headers=headers,
    )

    assert platform_effective.json()["feature_flags"]["module.discover.enabled"] is False
    assert org_effective.json()["feature_flags"]["module.discover.enabled"] is True


def test_inactive_flag_resolves_false() -> None:
    with SessionLocal() as db:
        service = FeatureFlagService(db)
        service.ensure_default_flags()
        flag = db.query(FeatureFlag).filter(FeatureFlag.flag_key == "module.flow.enabled").one()
        flag.is_active = False
        db.commit()

        flags = service.get_effective_feature_flags("platform", None)

    assert flags["feature_flags"]["module.flow.enabled"] is False


def test_unauthorized_user_cannot_set_override(client) -> None:
    create_test_user(client, email="owner@example.com")
    create_test_user(client, email="member@example.com")
    member_token = get_auth_token(client, email="member@example.com")

    response = client.put(
        "/api/v1/feature-flags/overrides",
        json={"flag_key": "module.desk.enabled", "scope_type": "platform", "enabled": True},
        headers=auth_headers(member_token),
    )

    assert response.status_code == 403


def test_platform_context_permissions_include_feature_flags(client) -> None:
    create_test_user(client, email="owner@example.com")
    token = get_auth_token(client, email="owner@example.com")

    response = client.get("/api/v1/me/permissions", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.json()
    assert payload["feature_flags"]["module.flow.enabled"] is True
    assert "flow" in payload["enabled_modules"]
