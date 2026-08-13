from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MemoryCollectionCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    collection_type: str = Field(min_length=1, max_length=100)


class MemoryCollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    collection_type: str | None = Field(default=None, min_length=1, max_length=100)


class MemoryCollectionRead(BaseModel):
    id: int
    workspace_id: int
    name: str
    description: str | None = None
    collection_type: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
