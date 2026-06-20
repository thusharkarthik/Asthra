from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lifecycle_relationship import LifecycleRelationship
from app.repositories.lifecycle_relationship_repository import LifecycleRelationshipRepository
from app.schemas.lifecycle_relationship import LifecycleGraphRead, LifecycleRelationshipCreate


class LifecycleRelationshipService:
    def __init__(self, db: Session) -> None:
        self.repository = LifecycleRelationshipRepository(db)

    def create(self, data: LifecycleRelationshipCreate) -> LifecycleRelationship:
        return self.repository.create(data)

    def list(self, **filters) -> list[LifecycleRelationship]:
        return self.repository.list(**filters)

    def delete(self, relationship_id: int) -> None:
        relationship = self.repository.get(relationship_id)
        if relationship is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relationship not found.")
        self.repository.delete(relationship)

    def lifecycle_graph_for_idea(self, idea_id: str) -> LifecycleGraphRead:
        relationships = self.repository.list_for_entity("idea", str(idea_id))
        return LifecycleGraphRead(
            idea_id=str(idea_id),
            relationships=relationships,
            documents=self._filter_by_entity_type(relationships, "doc_page"),
            work_items=self._filter_by_entity_type(relationships, "work_item"),
            roadmap_items=self._filter_by_entity_type(relationships, "roadmap_item"),
            sprints=self._filter_by_entity_type(relationships, "sprint"),
            releases=self._filter_by_entity_type(relationships, "release"),
        )

    def _filter_by_entity_type(
        self,
        relationships: list[LifecycleRelationship],
        entity_type: str,
    ) -> list[LifecycleRelationship]:
        return [
            relationship
            for relationship in relationships
            if relationship.source_type == entity_type or relationship.target_type == entity_type
        ]
