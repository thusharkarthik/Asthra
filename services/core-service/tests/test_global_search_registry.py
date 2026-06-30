from app.db.session import SessionLocal
from app.models.organization import Organization
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace
from app.services.global_search_registry import GlobalSearchRegistryService
from tests.conftest import auth_headers, create_test_user, get_auth_token


def _create_superuser(email: str = "search-superuser@example.com") -> User:
    with SessionLocal() as db:
        user = User(
            email=email,
            full_name="Search Superuser",
            hashed_password="test",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user


def _create_scope_tree(user: User, *, name_prefix: str = "Asthra") -> tuple[int, int, int]:
    with SessionLocal() as db:
        org = Organization(
            name=f"{name_prefix} Labs",
            slug=f"{name_prefix.lower()}-labs",
            description="Searchable organization",
            created_by_id=user.id,
            is_active=True,
        )
        db.add(org)
        db.flush()
        workspace = Workspace(
            name=f"{name_prefix} Engineering",
            slug=f"{name_prefix.lower()}-engineering",
            organization_id=org.id,
            description="Searchable workspace",
            created_by_id=user.id,
            is_active=True,
        )
        db.add(workspace)
        db.flush()
        project = Project(
            name=f"{name_prefix} Platform",
            key=f"{name_prefix[:4].upper()}",
            workspace_id=workspace.id,
            description="Searchable project",
            created_by_id=user.id,
            is_active=True,
            status="active",
        )
        db.add(project)
        db.commit()
        return org.id, workspace.id, project.id


def _result_types(payload: dict) -> set[str]:
    return {result["entity_type"] for result in payload["results"]}


def test_search_registry_metadata_loads() -> None:
    with SessionLocal() as db:
        registry = GlobalSearchRegistryService(db).get_search_registry()

    entity_types = {entity["entity_type"] for entity in registry}
    assert "core.organization" in entity_types
    assert "core.workspace" in entity_types
    assert "core.project" in entity_types
    assert "core.member" in entity_types


def test_search_returns_core_scope_entities() -> None:
    user = _create_superuser()
    _create_scope_tree(user, name_prefix="Asthra")
    with SessionLocal() as db:
        actor = db.get(User, user.id)
        payload = GlobalSearchRegistryService(db).search_global(actor, query="Asthra", limit=10)

    assert {"core.organization", "core.workspace", "core.project"}.issubset(_result_types(payload))
    assert all(result["route"].startswith("/") for result in payload["results"])


def test_empty_query_returns_empty_results() -> None:
    user = _create_superuser("empty-search@example.com")
    with SessionLocal() as db:
        actor = db.get(User, user.id)
        payload = GlobalSearchRegistryService(db).search_global(actor, query="   ", limit=10)

    assert payload["query"] == ""
    assert payload["results"] == []


def test_search_limit_is_enforced() -> None:
    user = _create_superuser("limit-search@example.com")
    _create_scope_tree(user, name_prefix="Limit")
    with SessionLocal() as db:
        actor = db.get(User, user.id)
        payload = GlobalSearchRegistryService(db).search_global(actor, query="Limit", limit=1)

    assert len(payload["results"]) == 1


def test_unauthorized_user_does_not_see_restricted_entities() -> None:
    owner = _create_superuser("restricted-owner@example.com")
    _create_scope_tree(owner, name_prefix="Restricted")
    with SessionLocal() as db:
        member = User(
            email="restricted-member@example.com",
            full_name="Restricted Member",
            hashed_password="test",
            is_active=True,
            is_superuser=False,
        )
        db.add(member)
        db.commit()
        db.refresh(member)

        payload = GlobalSearchRegistryService(db).search_global(member, query="Restricted", limit=10)

    assert "core.organization" not in _result_types(payload)
    assert "core.workspace" not in _result_types(payload)
    assert "core.project" not in _result_types(payload)


def test_search_api_and_registry_work(client) -> None:
    create_test_user(client, email="search-api@example.com")
    token = get_auth_token(client, email="search-api@example.com")
    headers = auth_headers(token)

    registry = client.get("/api/v1/search/registry", headers=headers)
    assert registry.status_code == 200
    assert "core.organization" in {entity["entity_type"] for entity in registry.json()["entities"]}

    response = client.get("/api/v1/search?q=search&limit=5", headers=headers)
    assert response.status_code == 200
    assert response.json()["limit"] == 5


def test_search_unauthenticated_request_rejected(client) -> None:
    response = client.get("/api/v1/search?q=anything")
    assert response.status_code in {401, 403}


def test_platform_context_includes_search_metadata(client) -> None:
    create_test_user(client, email="search-context@example.com")
    token = get_auth_token(client, email="search-context@example.com")

    response = client.get("/api/v1/context/platform", headers=auth_headers(token))

    assert response.status_code == 200
    payload = response.json()
    assert payload["search"]["available"] is True
    assert payload["search"]["endpoint"] == "/api/v1/search"
    assert "core.organization" in payload["search"]["entity_types"]
