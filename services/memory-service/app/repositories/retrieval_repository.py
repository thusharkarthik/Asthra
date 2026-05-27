from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.models.knowledge_document import KnowledgeDocument
from app.models.knowledge_source import KnowledgeSource
from app.models.retrieval_log import RetrievalLog


class RetrievalRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def keyword_search(
        self,
        *,
        query: str,
        top_k: int,
        source_id: int | None = None,
        workspace_id: int | None = None,
    ) -> list[tuple[DocumentChunk, KnowledgeDocument, KnowledgeSource]]:
        statement = (
            select(DocumentChunk, KnowledgeDocument, KnowledgeSource)
            .join(KnowledgeDocument, DocumentChunk.document_id == KnowledgeDocument.id)
            .join(KnowledgeSource, KnowledgeDocument.source_id == KnowledgeSource.id)
            .where(DocumentChunk.content.ilike(f"%{query}%"))
        )
        if source_id is not None:
            statement = statement.where(KnowledgeSource.id == source_id)
        if workspace_id is not None:
            statement = statement.where(KnowledgeSource.workspace_id == workspace_id)
        statement = statement.order_by(DocumentChunk.id).limit(top_k)
        return list(self.db.execute(statement).all())

    def create_log(
        self,
        *,
        query_text: str,
        retrieval_type: str,
        top_k: int,
        latency_ms: int,
    ) -> RetrievalLog:
        retrieval_log = RetrievalLog(
            query_text=query_text,
            retrieval_type=retrieval_type,
            top_k=top_k,
            latency_ms=latency_ms,
        )
        self.db.add(retrieval_log)
        self.db.commit()
        self.db.refresh(retrieval_log)
        return retrieval_log
