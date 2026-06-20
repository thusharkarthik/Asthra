from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.lifecycle_relationship import LifecycleRelationship
from app.schemas.lifecycle_relationship import LifecycleRelationshipCreate


class LifecycleRelationshipRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: LifecycleRelationshipCreate) -> LifecycleRelationship:
        relationship = LifecycleRelationship(**data.model_dump())
        self.db.add(relationship)
        self.db.commit()
        self.db.refresh(relationship)
        return relationship

    def list(
        self,
        *,
        source_type: str | None = None,
        source_id: str | None = None,
        target_type: str | None = None,
        target_id: str | None = None,
        relationship_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[LifecycleRelationship]:
        stmt = select(LifecycleRelationship)
        if source_type is not None:
            stmt = stmt.where(LifecycleRelationship.source_type == source_type)
        if source_id is not None:
            stmt = stmt.where(LifecycleRelationship.source_id == str(source_id))
        if target_type is not None:
            stmt = stmt.where(LifecycleRelationship.target_type == target_type)
        if target_id is not None:
            stmt = stmt.where(LifecycleRelationship.target_id == str(target_id))
        if relationship_type is not None:
            stmt = stmt.where(LifecycleRelationship.relationship_type == relationship_type)
        return list(self.db.scalars(stmt.order_by(LifecycleRelationship.id.desc()).limit(limit).offset(offset)).all())

    def list_for_entity(self, entity_type: str, entity_id: str) -> list[LifecycleRelationship]:
        stmt = select(LifecycleRelationship).where(
            or_(
                (LifecycleRelationship.source_type == entity_type) & (LifecycleRelationship.source_id == str(entity_id)),
                (LifecycleRelationship.target_type == entity_type) & (LifecycleRelationship.target_id == str(entity_id)),
            ),
        )
        return list(self.db.scalars(stmt.order_by(LifecycleRelationship.id.desc())).all())

    def get(self, relationship_id: int) -> LifecycleRelationship | None:
        return self.db.get(LifecycleRelationship, relationship_id)

    def delete(self, relationship: LifecycleRelationship) -> None:
        self.db.delete(relationship)
        self.db.commit()
