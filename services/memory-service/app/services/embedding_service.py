from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.embedding_record import EmbeddingRecord
from app.repositories.embedding_repository import EmbeddingRepository
from app.services.document_service import DocumentService


class EmbeddingService:
    def __init__(self, db: Session) -> None:
        self.embedding_repository = EmbeddingRepository(db)
        self.document_service = DocumentService(db)

    def generate_for_document(self, document_id: int) -> tuple[list[EmbeddingRecord], int, int]:
        self.document_service.get(document_id)
        chunks = self.embedding_repository.list_chunks_for_document(document_id)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has no chunks to embed.",
            )

        created_count = 0
        updated_count = 0
        records: list[EmbeddingRecord] = []
        for chunk in chunks:
            record, created = self.embedding_repository.upsert_placeholder(
                chunk_id=chunk.id,
                embedding_model=settings.memory_placeholder_embedding_model,
                status="generated",
            )
            records.append(record)
            if created:
                created_count += 1
            else:
                updated_count += 1
        return records, created_count, updated_count

    def list_by_document(self, document_id: int) -> list[EmbeddingRecord]:
        self.document_service.get(document_id)
        return self.embedding_repository.list_by_document(document_id)
