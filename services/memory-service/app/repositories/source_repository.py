from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.knowledge_source import KnowledgeSource
from app.schemas.knowledge_source import KnowledgeSourceCreate


class SourceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, source_create: KnowledgeSourceCreate) -> KnowledgeSource:
        source = KnowledgeSource(**source_create.model_dump())
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        return source

    def list(self, *, workspace_id: int | None = None) -> list[KnowledgeSource]:
        statement = select(KnowledgeSource)
        if workspace_id is not None:
            statement = statement.where(KnowledgeSource.workspace_id == workspace_id)
        statement = statement.order_by(KnowledgeSource.id)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, source_id: int) -> KnowledgeSource | None:
        return self.db.get(KnowledgeSource, source_id)

    def get_by_identity(
        self,
        *,
        workspace_id: int | None,
        source_type: str,
        external_reference: str | None,
    ) -> KnowledgeSource | None:
        statement = select(KnowledgeSource).where(
            KnowledgeSource.workspace_id == workspace_id,
            KnowledgeSource.source_type == source_type,
            KnowledgeSource.external_reference == external_reference,
        )
        return self.db.scalars(statement).first()
