from datetime import datetime

from pydantic import BaseModel, Field


class SavedViewCreate(BaseModel):
    workspace_id: int | None = None
    project_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    filters: dict = Field(default_factory=dict)
    is_default: bool = False


class SavedViewUpdate(BaseModel):
    workspace_id: int | None = None
    project_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    filters: dict | None = None
    is_default: bool | None = None


class SavedViewRead(BaseModel):
    id: int
    workspace_id: int | None = None
    project_id: int
    name: str
    description: str | None = None
    filters: dict
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
