from pydantic import BaseModel, Field, computed_field, field_validator

from app.schemas.base import TimestampedRead


class RoleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    scope: str = "organization"
    organization_id: int | None = None
    is_system: bool = False
    is_editable: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Role name is required.")
        return name


class RoleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    scope: str | None = None
    is_system: bool | None = None
    is_editable: bool | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        name = value.strip()
        if not name:
            raise ValueError("Role name is required.")
        return name


class RoleRead(TimestampedRead):
    organization_id: int | None = None
    name: str
    key: str
    description: str | None = None
    scope: str
    is_system: bool = False
    is_editable: bool = True
    is_active: bool

    @computed_field
    @property
    def permission_preset(self) -> str:
        return f"{self.scope}:{self.key}:placeholder"


class PermissionCreate(BaseModel):
    code: str = Field(min_length=1, max_length=150)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    module: str | None = Field(default=None, max_length=100)
    scope: str = "workspace"
    status: str = "active"

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        code = value.strip()
        if not code:
            raise ValueError("Permission code is required.")
        return code

    @field_validator("module", "scope", "status")
    @classmethod
    def normalize_optional_permission_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("Permission metadata values cannot be empty.")
        return normalized


class PermissionUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=150)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    module: str | None = Field(default=None, max_length=100)
    scope: str | None = None
    status: str | None = None
    is_active: bool | None = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str | None) -> str | None:
        if value is None:
            return value
        code = value.strip()
        if not code:
            raise ValueError("Permission code is required.")
        return code

    @field_validator("module", "scope", "status")
    @classmethod
    def normalize_optional_permission_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("Permission metadata values cannot be empty.")
        return normalized


class PermissionRead(TimestampedRead):
    role_id: int | None = None
    key: str
    code: str
    name: str
    description: str | None = None
    module: str | None = None
    scope: str = "workspace"
    status: str = "active"
    is_active: bool


class RolePermissionCreate(BaseModel):
    permission_id: int


class RolePermissionsReplace(BaseModel):
    permission_ids: list[int] = Field(default_factory=list)


class RoleTemplateRead(BaseModel):
    name: str
    key: str
    scope: str
    description: str
    permission_patterns: list[str]
    is_system: bool
    is_editable: bool


class RolePermissionRead(TimestampedRead):
    role_id: int
    permission_id: int


class UserRoleCreate(BaseModel):
    role_id: int


class UserRoleRead(TimestampedRead):
    user_id: int
    role_id: int
