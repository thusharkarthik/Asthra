from pydantic import BaseModel, Field


class NavigationItemRead(BaseModel):
    nav_key: str
    label: str
    route: str
    mode: str
    group: str
    icon: str
    order: int
    required_any_permissions: list[str]
    required_feature_flag: str | None = None
    module_key: str | None = None
    default_visible: bool
    is_customizable: bool
    description: str | None = None
    children: list["NavigationItemRead"] = Field(default_factory=list)


class NavigationModeRead(BaseModel):
    items: list[NavigationItemRead]


class NavigationResponse(BaseModel):
    version: int
    modes: dict[str, NavigationModeRead]


NavigationItemRead.model_rebuild()
