from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead
from app.schemas.document_chunk import DocumentChunkRead


class RetrievalLogCreate(BaseModel):
    query_text: str = Field(min_length=1)
    retrieval_type: str = Field(min_length=1, max_length=100)
    top_k: int | None = Field(default=None, ge=1)
    latency_ms: int | None = Field(default=None, ge=0)


class RetrievalLogRead(TimestampedRead):
    query_text: str
    retrieval_type: str
    top_k: int | None = None
    latency_ms: int | None = None


class RetrievalSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int | None = Field(default=10, ge=1, le=100)
    source_id: int | None = None
    workspace_id: int | None = None
    document_id: int | None = None


class RetrievalSearchResult(BaseModel):
    chunk: DocumentChunkRead
    document_id: int
    document_title: str
    source_id: int
    workspace_id: int | None = None
    match_type: str
    score: float | None = None
    metadata: dict | None = None


class RetrievalSearchResponse(BaseModel):
    query: str
    retrieval_type: str
    top_k: int
    result_count: int
    latency_ms: int
    results: list[RetrievalSearchResult]
