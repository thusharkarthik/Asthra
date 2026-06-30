from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.models.user import User
from app.services.ai_context_registry import AIContextRegistryService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _create_superuser() -> User:
    with SessionLocal() as db:
        user = User(
            email="ai-context-superuser@example.com",
            full_name="AI Context Superuser",
            hashed_password="test",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _block_by_key(payload: dict, key: str) -> dict:
    return next(block for block in payload["context_blocks"] if block["key"] == key)


def test_ai_context_registry_metadata_loads() -> None:
    with SessionLocal() as db:
        registry = AIContextRegistryService(db).get_ai_context_registry()

    keys = {block["key"] for block in registry}
    assert "core.user_context" in keys
    assert "core.access_context" in keys
    assert "core.module_context" in keys


def test_core_context_blocks_resolve_for_user() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        payload = AIContextRegistryService(db).resolve_ai_context_for_user(user)

    assert payload["summary"]["block_count"] >= 6
    user_block = _block_by_key(payload, "core.user_context")
    assert user_block["data"]["email"] == "ai-context-superuser@example.com"
    access_block = _block_by_key(payload, "core.access_context")
    assert access_block["data"]["permission_count"] >= 0
    module_block = _block_by_key(payload, "core.module_context")
    assert "available_modules" in module_block["data"]


def test_ai_context_resolver_returns_sorted_blocks() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        payload = AIContextRegistryService(db).resolve_ai_context_for_user(user)

    priorities = [block["priority"] for block in payload["context_blocks"]]
    assert priorities == sorted(priorities)


def test_ai_context_can_filter_categories() -> None:
    user = _create_superuser()
    with SessionLocal() as db:
        payload = AIContextRegistryService(db).resolve_ai_context_for_user(user, categories=["identity"])

    assert payload["summary"]["categories"] == ["identity"]
    assert [block["key"] for block in payload["context_blocks"]] == ["core.user_context"]


def test_ai_context_unauthenticated_request_rejected() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/ai/context")

    assert response.status_code in {401, 403}


def test_authenticated_ai_context_endpoint_returns_blocks() -> None:
    with TestClient(app) as client:
        create_test_user(client, email="ai-context-owner@example.com")
        token = get_auth_token(client, email="ai-context-owner@example.com")

        response = client.get("/api/v1/ai/context", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["block_count"] >= 6
    assert "core.user_context" in {block["key"] for block in payload["context_blocks"]}


def test_ai_context_registry_endpoint_returns_metadata_only() -> None:
    with TestClient(app) as client:
        create_test_user(client, email="ai-context-registry@example.com")
        token = get_auth_token(client, email="ai-context-registry@example.com")

        response = client.get("/api/v1/ai/context/registry", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.json()
    assert "context_blocks" in payload
    assert "data" not in payload["context_blocks"][0]


def test_platform_context_includes_ai_context_metadata() -> None:
    with TestClient(app) as client:
        create_test_user(client, email="ai-context-platform@example.com")
        token = get_auth_token(client, email="ai-context-platform@example.com")

        response = client.get("/api/v1/context/platform", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.json()
    assert payload["ai_context"]["available"] is True
    assert payload["ai_context"]["endpoint"] == "/api/v1/ai/context"
    assert "identity" in payload["ai_context"]["categories"]
