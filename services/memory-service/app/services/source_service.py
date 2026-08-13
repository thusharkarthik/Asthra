from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.knowledge_source import KnowledgeSource
from app.repositories.source_repository import SourceRepository
from app.schemas.knowledge_source import KnowledgeSourceCreate


class SourceService:
    def __init__(self, db: Session) -> None:
        self.source_repository = SourceRepository(db)

    def create(self, source_create: KnowledgeSourceCreate) -> KnowledgeSource:
        return self.source_repository.create(source_create)

    def get_or_create(self, source_create: KnowledgeSourceCreate) -> KnowledgeSource:
        existing = self.source_repository.get_by_identity(
            workspace_id=source_create.workspace_id,
            source_type=source_create.source_type,
            external_reference=source_create.external_reference,
        )
        if existing is not None:
            return existing
        return self.create(source_create)

    def list(self, *, workspace_id: int | None = None) -> list[KnowledgeSource]:
        return self.source_repository.list(workspace_id=workspace_id)

    def get(self, source_id: int) -> KnowledgeSource:
        source = self.source_repository.get_by_id(source_id)
        if source is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Knowledge source not found.",
            )
        return source
