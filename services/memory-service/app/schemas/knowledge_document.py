from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeDocumentCreate(BaseModel):
    source_id: int
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    content_type: str = Field(min_length=1, max_length=100)
    metadata: dict[str, Any] | None = None


class KnowledgeDocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    content_type: str | None = Field(default=None, min_length=1, max_length=100)
    metadata: dict[str, Any] | None = None


class KnowledgeDocumentRead(BaseModel):
    id: int
    source_id: int
    title: str
    content: str
    content_type: str
    metadata_: dict[str, Any] | None = Field(default=None, serialization_alias="metadata")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
