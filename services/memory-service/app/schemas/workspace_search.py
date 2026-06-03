from pydantic import BaseModel, Field


class WorkspaceSearchRequest(BaseModel):
    workspace_id: int
    query: str = Field(min_length=1)
    top_k: int = Field(default=10, ge=1, le=100)


class WorkspaceSearchResult(BaseModel):
    source_type: str
    title: str
    chunk: str
    relevance_score: float | None = None
    source_reference: str | None = None
    document_id: int
    chunk_id: int
    metadata: dict | None = None


class WorkspaceSearchResponse(BaseModel):
    workspace_id: int
    query: str
    top_k: int
    result_count: int
    results: list[WorkspaceSearchResult]
