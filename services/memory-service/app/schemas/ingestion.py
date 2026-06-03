from typing import Any

from pydantic import BaseModel, Field


class MemoryIngestRequest(BaseModel):
    source_type: str = Field(min_length=1)
    external_reference: str = Field(min_length=1)
    workspace_id: int
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class MemoryIngestResponse(BaseModel):
    source_id: int
    document_id: int
    chunks_created: int
    embeddings_created: int
    source_type: str
    external_reference: str
