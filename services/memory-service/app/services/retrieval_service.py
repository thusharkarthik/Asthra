from __future__ import annotations

from time import perf_counter

from sqlalchemy.orm import Session

from app.repositories.retrieval_repository import RetrievalRepository
from app.schemas.retrieval_log import (
    RetrievalSearchRequest,
    RetrievalSearchResponse,
    RetrievalSearchResult,
)


class RetrievalService:
    def __init__(self, db: Session) -> None:
        self.retrieval_repository = RetrievalRepository(db)

    def keyword_search(self, search_request: RetrievalSearchRequest) -> RetrievalSearchResponse:
        started_at = perf_counter()
        top_k = search_request.top_k or 10
        matches = self.retrieval_repository.keyword_search(
            query=search_request.query,
            top_k=top_k,
            source_id=search_request.source_id,
            workspace_id=search_request.workspace_id,
        )
        latency_ms = int((perf_counter() - started_at) * 1000)
        self.retrieval_repository.create_log(
            query_text=search_request.query,
            retrieval_type="keyword",
            top_k=top_k,
            latency_ms=latency_ms,
        )

        results = [
            RetrievalSearchResult(
                chunk=chunk,
                document_id=document.id,
                document_title=document.title,
                source_id=source.id,
                workspace_id=source.workspace_id,
                match_type="keyword",
            )
            for chunk, document, source in matches
        ]
        return RetrievalSearchResponse(
            query=search_request.query,
            retrieval_type="keyword",
            top_k=top_k,
            result_count=len(results),
            latency_ms=latency_ms,
            results=results,
        )
