from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.memory_collection import MemoryCollection
from app.repositories.collection_repository import CollectionRepository
from app.schemas.memory_collection import MemoryCollectionCreate, MemoryCollectionUpdate


class CollectionService:
    def __init__(self, db: Session) -> None:
        self.repository = CollectionRepository(db)

    def create(self, data: MemoryCollectionCreate) -> MemoryCollection:
        return self.repository.create(data)

    def list(self, *, workspace_id: int | None = None, collection_type: str | None = None) -> list[MemoryCollection]:
        return self.repository.list(workspace_id=workspace_id, collection_type=collection_type)

    def get(self, collection_id: int) -> MemoryCollection:
        collection = self.repository.get(collection_id)
        if collection is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory collection not found.")
        return collection

    def update(self, collection_id: int, data: MemoryCollectionUpdate) -> MemoryCollection:
        return self.repository.update(self.get(collection_id), data)

    def delete(self, collection_id: int) -> None:
        self.repository.delete(self.get(collection_id))
