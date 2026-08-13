from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.models.knowledge_document import KnowledgeDocument
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.schemas.knowledge_document import KnowledgeDocumentCreate, KnowledgeDocumentUpdate
from app.services.chunking_service import ChunkingService
from app.services.event_publisher import publish_event
from app.services.source_service import SourceService


class DocumentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.document_repository = DocumentRepository(db)
        self.chunk_repository = ChunkRepository(db)
        self.source_service = SourceService(db)
        self.chunking_service = ChunkingService()

    def create(self, document_create: KnowledgeDocumentCreate) -> KnowledgeDocument:
        self.source_service.get(document_create.source_id)
        document = self.document_repository.create(document_create)
        self._rebuild_chunks(document)
        publish_event(
            "memory.document.created",
            payload={"title": document.title, "source_id": document.source_id},
            entity_type="knowledge_document",
            entity_id=str(document.id),
        )
        return document

    def list(
        self,
        *,
        source_id: int | None = None,
        content_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[KnowledgeDocument]:
        return self.document_repository.list(
            source_id=source_id,
            content_type=content_type,
            limit=limit,
            offset=offset,
        )

    def get(self, document_id: int) -> KnowledgeDocument:
        document = self.document_repository.get_by_id(document_id)
        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Knowledge document not found.",
            )
        return document

    def update(
        self,
        document_id: int,
        document_update: KnowledgeDocumentUpdate,
    ) -> KnowledgeDocument:
        document = self.get(document_id)
        updated_document = self.document_repository.update(document, document_update)
        if document_update.content is not None:
            self._rebuild_chunks(updated_document)
        return updated_document

    def delete(self, document_id: int) -> None:
        document = self.get(document_id)
        self.chunk_repository.delete_by_document(document.id)
        self.document_repository.delete(document)

    def list_chunks(self, document_id: int) -> list[DocumentChunk]:
        self.get(document_id)
        return self.chunk_repository.list_by_document(document_id)

    def _rebuild_chunks(self, document: KnowledgeDocument) -> list[DocumentChunk]:
        chunks = self.chunking_service.chunk_text(document.content)
        rebuilt_chunks = self.chunk_repository.replace_document_chunks(
            document_id=document.id,
            chunks=chunks,
        )
        publish_event(
            "memory.document.chunked",
            payload={"document_id": document.id, "chunk_count": len(rebuilt_chunks)},
            entity_type="knowledge_document",
            entity_id=str(document.id),
        )
        return rebuilt_chunks
