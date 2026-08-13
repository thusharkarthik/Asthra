from enum import Enum
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


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


class RoleNavigationVisibility(str, Enum):
    default = "default"
    hidden = "hidden"
    show_when_allowed = "show_when_allowed"
    show_locked_if_denied = "show_locked_if_denied"


class RoleNavigationConfigItemRead(TimestampedRead):
    role_id: int
    mode: str
    nav_key: str
    visibility: RoleNavigationVisibility
    order_override: int | None = None
    label_override: str | None = None
    group_override: str | None = None
    is_active: bool


class RoleNavigationConfigUpdateItem(BaseModel):
    nav_key: str = Field(min_length=1, max_length=150)
    visibility: RoleNavigationVisibility = RoleNavigationVisibility.default
    order_override: int | None = None
    label_override: str | None = Field(default=None, max_length=255)
    group_override: str | None = Field(default=None, max_length=100)
    is_active: bool = True

    @field_validator("nav_key")
    @classmethod
    def normalize_nav_key(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("Navigation key is required.")
        return normalized

    @field_validator("label_override", "group_override")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None


class RoleNavigationConfigBatchUpdate(BaseModel):
    role_id: int
    mode: str = Field(min_length=1, max_length=50)
    items: list[RoleNavigationConfigUpdateItem] = Field(default_factory=list)

    @field_validator("mode")
    @classmethod
    def normalize_mode(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized == "organization":
            normalized = "org"
        if not normalized:
            raise ValueError("Navigation mode is required.")
        return normalized


class RoleNavigationConfigResponse(BaseModel):
    role_id: int
    mode: str
    items: list[RoleNavigationConfigItemRead]


class RoleNavigationConfigPreviewItem(BaseModel):
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
    config: RoleNavigationConfigItemRead | None = None
    preview_visibility: RoleNavigationVisibility
    preview_label: str
    preview_group: str
    preview_order: int


class RoleNavigationConfigPreviewResponse(BaseModel):
    role_id: int
    mode: str
    generated_at: datetime
    items: list[RoleNavigationConfigPreviewItem]


NavigationItemRead.model_rebuild()
