from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.embedding_record import EmbeddingRecord
from app.providers.embedding_provider_factory import get_embedding_provider
from app.repositories.embedding_repository import EmbeddingRepository
from app.services.document_service import DocumentService
from app.vectorstores.in_memory_vector_store import get_vector_store


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
        provider = get_embedding_provider()
        vector_store = get_vector_store()
        for chunk in chunks:
            vector = provider.embed_text(chunk.content)
            vector_id = vector_store.upsert_vector(
                chunk_id=chunk.id,
                vector=vector,
                metadata={
                    "chunk_id": chunk.id,
                    "document_id": chunk.document_id,
                    "chunk_index": chunk.chunk_index,
                },
            )
            record, created = self.embedding_repository.upsert_placeholder(
                chunk_id=chunk.id,
                embedding_model=provider.model_name,
                status="generated",
                vector_id=vector_id,
            )
            records.append(record)
            if created:
                created_count += 1
            else:
                updated_count += 1
        return records, created_count, updated_count

    def provider_summary(self) -> tuple[str, str]:
        provider = get_embedding_provider()
        return settings.embedding_provider, provider.model_name

    def list_by_document(self, document_id: int) -> list[EmbeddingRecord]:
        self.document_service.get(document_id)
        return self.embedding_repository.list_by_document(document_id)
