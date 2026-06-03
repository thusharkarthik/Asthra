from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas.ingestion import MemoryIngestRequest, MemoryIngestResponse
from app.schemas.knowledge_document import KnowledgeDocumentCreate
from app.schemas.knowledge_source import KnowledgeSourceCreate
from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.event_publisher import publish_event
from app.services.source_registry import normalize_source_metadata
from app.services.source_service import SourceService


class IngestionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.source_service = SourceService(db)
        self.document_service = DocumentService(db)
        self.embedding_service = EmbeddingService(db)

    def ingest(self, data: MemoryIngestRequest) -> MemoryIngestResponse:
        source_metadata = normalize_source_metadata(
            source_type=data.source_type,
            external_reference=data.external_reference,
            workspace_id=data.workspace_id,
            title=data.title,
            metadata=data.metadata,
        )
        source = self.source_service.get_or_create(
            KnowledgeSourceCreate(
                workspace_id=source_metadata.workspace_id,
                source_type=source_metadata.source_type.value,
                name=source_metadata.title,
                external_reference=source_metadata.external_reference,
            ),
        )
        document = self.document_service.create(
            KnowledgeDocumentCreate(
                source_id=source.id,
                title=data.title,
                content=data.content,
                content_type="text/plain",
                metadata=source_metadata.metadata,
            ),
        )
        chunks_created = len(self.document_service.list_chunks(document.id))
        records, embeddings_created, _ = self.embedding_service.generate_for_document(document.id)
        publish_event(
            "memory.document.ingested",
            payload={
                "document_id": document.id,
                "source_type": source.source_type,
                "external_reference": source.external_reference,
                "chunks_created": chunks_created,
                "embeddings_created": len(records),
            },
            workspace_id=source.workspace_id,
            entity_type="knowledge_document",
            entity_id=str(document.id),
        )
        return MemoryIngestResponse(
            source_id=source.id,
            document_id=document.id,
            chunks_created=chunks_created,
            embeddings_created=embeddings_created,
            source_type=source.source_type,
            external_reference=source.external_reference or "",
        )
