from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


class RoleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    scope: str = "organization"
    organization_id: int | None = None

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
    is_active: bool


class PermissionCreate(BaseModel):
    code: str = Field(min_length=1, max_length=150)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        code = value.strip()
        if not code:
            raise ValueError("Permission code is required.")
        return code


class PermissionUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=150)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
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


class PermissionRead(TimestampedRead):
    role_id: int | None = None
    key: str
    code: str
    name: str
    description: str | None = None
    is_active: bool


class RolePermissionCreate(BaseModel):
    permission_id: int


class RolePermissionRead(TimestampedRead):
    role_id: int
    permission_id: int


class UserRoleCreate(BaseModel):
    role_id: int


class UserRoleRead(TimestampedRead):
    user_id: int
    role_id: int
