from __future__ import annotations

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.completion import (
    ChatCompletionRequest,
    ChatMessage,
    RAGCompletionRequest,
    RAGCompletionResponse,
    RAGSourceChunk,
)
from app.services.provider_service import ProviderService


class RAGService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def generate_rag_completion(self, rag_request: RAGCompletionRequest) -> RAGCompletionResponse:
        retrieval_payload = self._retrieve_context(rag_request)
        sources = self._build_sources(retrieval_payload)
        context = self._build_context(sources)
        completion = ProviderService(self.db).generate_chat_completion(
            ChatCompletionRequest(
                provider=rag_request.provider,
                model=rag_request.model,
                system_prompt=rag_request.system_prompt or "Answer using the provided context. If the context is insufficient, say so.",
                messages=[
                    ChatMessage(
                        role="user",
                        content=f"Context:\n{context}\n\nQuestion:\n{rag_request.query}",
                    ),
                ],
            ),
        )
        return RAGCompletionResponse(
            answer=completion.generated_text,
            sources=sources,
            provider=completion.provider,
            model=completion.model,
            usage=completion.usage,
            retrieval_metadata={
                "retrieval_type": retrieval_payload.get("retrieval_type"),
                "top_k": retrieval_payload.get("top_k"),
                "result_count": retrieval_payload.get("result_count"),
                "latency_ms": retrieval_payload.get("latency_ms"),
            },
        )

    def _retrieve_context(self, rag_request: RAGCompletionRequest) -> dict:
        memory_url = (rag_request.memory_service_url or settings.memory_service_url).rstrip("/")
        try:
            response = httpx.post(
                f"{memory_url}/api/v1/retrieval/semantic-search",
                json={
                    "query": rag_request.query,
                    "top_k": rag_request.top_k or 5,
                    "workspace_id": rag_request.workspace_id,
                },
                timeout=10.0,
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Memory Service is unavailable.",
            ) from exc
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Memory Service retrieval failed.",
            )
        return response.json()

    def _build_sources(self, retrieval_payload: dict) -> list[RAGSourceChunk]:
        sources: list[RAGSourceChunk] = []
        for result in retrieval_payload.get("results", []):
            chunk = result.get("chunk") or {}
            sources.append(
                RAGSourceChunk(
                    chunk_id=chunk.get("id"),
                    document_id=result.get("document_id"),
                    document_title=result.get("document_title"),
                    content=chunk.get("content", ""),
                    source_id=result.get("source_id"),
                    workspace_id=result.get("workspace_id"),
                    score=result.get("score"),
                    metadata=result.get("metadata"),
                ),
            )
        return sources

    def _build_context(self, sources: list[RAGSourceChunk]) -> str:
        if not sources:
            return "No context was retrieved."
        return "\n\n".join(
            f"[source:{source.document_id}/chunk:{source.chunk_id}] {source.content}"
            for source in sources
        )
