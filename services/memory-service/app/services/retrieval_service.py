from __future__ import annotations

from time import perf_counter

from sqlalchemy.orm import Session

from app.providers.embedding_provider_factory import get_embedding_provider
from app.repositories.retrieval_repository import RetrievalRepository
from app.schemas.retrieval_log import (
    RetrievalSearchRequest,
    RetrievalSearchResponse,
    RetrievalSearchResult,
)
from app.vectorstores.in_memory_vector_store import get_vector_store


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
            document_id=search_request.document_id,
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

    def semantic_search(self, search_request: RetrievalSearchRequest) -> RetrievalSearchResponse:
        started_at = perf_counter()
        top_k = search_request.top_k or 10
        provider = get_embedding_provider()
        query_vector = provider.embed_text(search_request.query)
        vector_results = get_vector_store().search(
            query_vector=query_vector,
            top_k=top_k,
            filters={
                "document_id": search_request.document_id,
            },
        )
        chunk_map = self.retrieval_repository.get_chunks_by_ids([result.chunk_id for result in vector_results])

        results: list[RetrievalSearchResult] = []
        for vector_result in vector_results:
            chunk_data = chunk_map.get(vector_result.chunk_id)
            if chunk_data is None:
                continue
            chunk, document, source = chunk_data
            if search_request.source_id is not None and source.id != search_request.source_id:
                continue
            if search_request.workspace_id is not None and source.workspace_id != search_request.workspace_id:
                continue
            results.append(
                RetrievalSearchResult(
                    chunk=chunk,
                    document_id=document.id,
                    document_title=document.title,
                    source_id=source.id,
                    workspace_id=source.workspace_id,
                    match_type="semantic",
                    score=vector_result.score,
                    metadata=vector_result.metadata,
                ),
            )

        latency_ms = int((perf_counter() - started_at) * 1000)
        self.retrieval_repository.create_log(
            query_text=search_request.query,
            retrieval_type="semantic",
            top_k=top_k,
            latency_ms=latency_ms,
        )
        return RetrievalSearchResponse(
            query=search_request.query,
            retrieval_type="semantic",
            top_k=top_k,
            result_count=len(results),
            latency_ms=latency_ms,
            results=results,
        )
