from __future__ import annotations

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.assistant import AssistantSource


class AssistantContextService:
    def retrieve_workspace_context(
        self,
        *,
        workspace_id: int,
        query: str,
        top_k: int = 5,
        memory_service_url: str | None = None,
    ) -> tuple[list[AssistantSource], dict]:
        memory_url = (memory_service_url or settings.memory_service_url).rstrip("/")
        try:
            response = httpx.post(
                f"{memory_url}/api/v1/workspace-search",
                json={"workspace_id": workspace_id, "query": query, "top_k": top_k},
                timeout=10.0,
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Memory Service is unavailable.") from exc
        if response.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Memory Service workspace search failed.")

        payload = response.json()
        sources = [
            AssistantSource(
                source_type=result.get("source_type"),
                source_reference=result.get("source_reference"),
                title=result.get("title"),
                content=result.get("chunk", ""),
                relevance_score=result.get("relevance_score"),
                metadata=result.get("metadata"),
            )
            for result in payload.get("results", [])
        ]
        metadata = {
            "workspace_id": payload.get("workspace_id", workspace_id),
            "query": payload.get("query", query),
            "top_k": payload.get("top_k", top_k),
            "result_count": payload.get("result_count", len(sources)),
            "retrieval_type": "workspace_memory",
        }
        return sources, metadata

    def build_context_text(self, sources: list[AssistantSource]) -> str:
        if not sources:
            return "No workspace memory context was retrieved."
        return "\n\n".join(
            f"[{source.source_type or 'unknown'}:{source.source_reference or 'n/a'}] {source.content}"
            for source in sources
        )
