from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SearchScopeRead(BaseModel):
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None


class SearchableEntityRead(BaseModel):
    entity_type: str
    source_module: str
    display_name: str
    description: str
    category: str
    route_template: str
    icon: str
    requires_feature_flag: str | None = None
    requires_permissions: list[str]
    is_active: bool
    sort_order: int


class SearchRegistryRead(BaseModel):
    entities: list[SearchableEntityRead]


class SearchResultRead(BaseModel):
    id: str
    entity_type: str
    source_module: str
    title: str
    subtitle: str
    description: str | None = None
    route: str
    icon: str
    category: str
    scope: SearchScopeRead
    matched_fields: list[str]
    score: int
    metadata: dict[str, Any]


class SearchResponseRead(BaseModel):
    query: str
    limit: int
    generated_at: datetime
    results: list[SearchResultRead]


class SearchMetadataRead(BaseModel):
    available: bool
    endpoint: str
    registry_endpoint: str
    categories: list[str]
    entity_types: list[str]
    shortcut: str
