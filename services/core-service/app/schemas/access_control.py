from pydantic import BaseModel, Field


class PermissionScopeRead(BaseModel):
    scope_type: str
    scope_id: int | None = None


class ResolvedRoleRead(BaseModel):
    id: int
    name: str
    key: str
    scope: str
    source_scope_type: str
    source_scope_id: int | None = None


class CurrentUserPermissionsRead(BaseModel):
    permission_codes: list[str]
    roles: list[ResolvedRoleRead]
    scope: PermissionScopeRead
    feature_flags: dict[str, bool] = Field(default_factory=dict)
    enabled_modules: list[str] = Field(default_factory=list)
