from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class ConfigurationDefinitionRead(TimestampedRead):
    config_key: str
    name: str
    description: str | None = None
    category: str
    source_module: str
    value_type: str
    default_value: Any = None
    allowed_values: list[Any] | None = None
    is_secret: bool
    is_system: bool
    is_active: bool
    supports_inheritance: bool


class ConfigurationValueRead(TimestampedRead):
    config_key: str
    scope_type: str
    scope_id: int | None = None
    value: Any = None
    reason: str | None = None
    created_by: int | None = None
    updated_by: int | None = None


class ConfigurationValueUpsert(BaseModel):
    config_key: str
    scope_type: str
    scope_id: int | None = None
    value: Any
    reason: str | None = None


class EffectiveConfigurationItem(BaseModel):
    config_key: str
    name: str
    category: str
    source_module: str
    value_type: str
    value: Any = None
    inherited_from: str
    inherited_scope_id: int | None = None
    is_secret: bool


class EffectiveConfigurationRead(BaseModel):
    scope_type: str
    scope_id: int | None = None
    generated_at: datetime
    configuration: dict[str, EffectiveConfigurationItem]


class ConfigurationCatalogRead(BaseModel):
    definitions: list[ConfigurationDefinitionRead]


class ConfigurationMetadataRead(BaseModel):
    available: bool
    endpoint: str
    definition_count: int
    categories: list[str]
    source_modules: list[str]
    scope_inheritance: list[str]
