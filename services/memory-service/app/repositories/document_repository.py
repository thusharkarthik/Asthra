from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.knowledge_document import KnowledgeDocument
from app.schemas.knowledge_document import KnowledgeDocumentCreate, KnowledgeDocumentUpdate


class DocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, document_create: KnowledgeDocumentCreate) -> KnowledgeDocument:
        data = document_create.model_dump()
        metadata = data.pop("metadata", None)
        document = KnowledgeDocument(**data, metadata_=metadata)
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def list(
        self,
        *,
        source_id: int | None = None,
        content_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[KnowledgeDocument]:
        statement = select(KnowledgeDocument)
        if source_id is not None:
            statement = statement.where(KnowledgeDocument.source_id == source_id)
        if content_type is not None:
            statement = statement.where(KnowledgeDocument.content_type == content_type)
        statement = statement.order_by(KnowledgeDocument.id).limit(limit).offset(offset)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, document_id: int) -> KnowledgeDocument | None:
        return self.db.get(KnowledgeDocument, document_id)

    def update(
        self,
        document: KnowledgeDocument,
        document_update: KnowledgeDocumentUpdate,
    ) -> KnowledgeDocument:
        update_data = document_update.model_dump(exclude_unset=True)
        if "metadata" in update_data:
            document.metadata_ = update_data.pop("metadata")
        for field, value in update_data.items():
            setattr(document, field, value)
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def delete(self, document: KnowledgeDocument) -> None:
        self.db.delete(document)
        self.db.commit()
