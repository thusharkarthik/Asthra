from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class SpaceCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    created_by_id: int


class SpaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class SpaceRead(TimestampedRead):
    workspace_id: int
    name: str
    description: str | None = None
    created_by_id: int
    is_active: bool
