from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.memory_collection import MemoryCollection
from app.schemas.memory_collection import MemoryCollectionCreate, MemoryCollectionUpdate


class CollectionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: MemoryCollectionCreate) -> MemoryCollection:
        collection = MemoryCollection(**data.model_dump())
        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)
        return collection

    def list(self, *, workspace_id: int | None = None, collection_type: str | None = None) -> list[MemoryCollection]:
        statement = select(MemoryCollection)
        if workspace_id is not None:
            statement = statement.where(MemoryCollection.workspace_id == workspace_id)
        if collection_type is not None:
            statement = statement.where(MemoryCollection.collection_type == collection_type)
        statement = statement.order_by(MemoryCollection.id)
        return list(self.db.scalars(statement).all())

    def get(self, collection_id: int) -> MemoryCollection | None:
        return self.db.get(MemoryCollection, collection_id)

    def update(self, collection: MemoryCollection, data: MemoryCollectionUpdate) -> MemoryCollection:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(collection, field, value)
        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)
        return collection

    def delete(self, collection: MemoryCollection) -> None:
        self.db.delete(collection)
        self.db.commit()
