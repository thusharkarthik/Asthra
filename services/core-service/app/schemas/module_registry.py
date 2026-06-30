from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class ModuleRegistryItemRead(TimestampedRead):
    module_key: str
    name: str
    description: str | None = None
    category: str
    route: str
    icon: str
    navigation_mode: str
    required_feature_flag: str | None = None
    required_permissions: list[str]
    sort_order: int
    is_system: bool
    is_active: bool


class AvailableModuleRead(BaseModel):
    module_key: str
    name: str
    description: str | None = None
    category: str
    route: str
    icon: str
    navigation_mode: str
    required_feature_flag: str | None = None
    required_permissions: list[str]
    sort_order: int
    enabled: bool
    visible: bool


class AvailableModulesResponse(BaseModel):
    navigation_mode: str
    modules: list[AvailableModuleRead]


class ModuleCatalogResponse(BaseModel):
    modules: list[ModuleRegistryItemRead]
