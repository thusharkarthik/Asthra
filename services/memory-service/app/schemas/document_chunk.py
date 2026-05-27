from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DocumentChunkCreate(BaseModel):
    document_id: int
    chunk_index: int = Field(ge=0)
    content: str = Field(min_length=1)
    token_count: int | None = Field(default=None, ge=0)
    metadata: dict[str, Any] | None = None


class DocumentChunkRead(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    token_count: int | None = None
    metadata_: dict[str, Any] | None = Field(default=None, serialization_alias="metadata")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
