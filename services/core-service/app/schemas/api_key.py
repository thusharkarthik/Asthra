from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class APIKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    organization_id: int | None = None
    workspace_id: int | None = None
    scopes: list[str] = Field(default_factory=list)
    expires_at: datetime | None = None


class APIKeyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    scopes: list[str] | None = None
    expires_at: datetime | None = None
    is_active: bool | None = None


class APIKeyRead(TimestampedRead):
    user_id: int
    organization_id: int | None = None
    workspace_id: int | None = None
    name: str
    key_prefix: str
    scopes: list[str] = Field(default_factory=list)
    is_active: bool
    last_used_at: datetime | None = None
    expires_at: datetime | None = None


class APIKeyCreateResponse(APIKeyRead):
    api_key: str
