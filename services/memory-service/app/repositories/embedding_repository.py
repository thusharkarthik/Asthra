from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.models.embedding_record import EmbeddingRecord


class EmbeddingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_chunks_for_document(self, document_id: int) -> list[DocumentChunk]:
        statement = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
        )
        return list(self.db.scalars(statement).all())

    def get_by_chunk_and_model(
        self,
        *,
        chunk_id: int,
        embedding_model: str,
    ) -> EmbeddingRecord | None:
        statement = select(EmbeddingRecord).where(
            EmbeddingRecord.chunk_id == chunk_id,
            EmbeddingRecord.embedding_model == embedding_model,
        )
        return self.db.scalars(statement).first()

    def upsert_placeholder(
        self,
        *,
        chunk_id: int,
        embedding_model: str,
        status: str,
        vector_id: str | None = None,
    ) -> tuple[EmbeddingRecord, bool]:
        existing = self.get_by_chunk_and_model(
            chunk_id=chunk_id,
            embedding_model=embedding_model,
        )
        if existing is not None:
            existing.embedding_status = status
            existing.vector_id = vector_id
            self.db.add(existing)
            self.db.commit()
            self.db.refresh(existing)
            return existing, False

        record = EmbeddingRecord(
            chunk_id=chunk_id,
            embedding_model=embedding_model,
            vector_id=vector_id,
            embedding_status=status,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record, True

    def list_by_document(self, document_id: int) -> list[EmbeddingRecord]:
        statement = (
            select(EmbeddingRecord)
            .join(DocumentChunk, EmbeddingRecord.chunk_id == DocumentChunk.id)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index, EmbeddingRecord.id)
        )
        return list(self.db.scalars(statement).all())
