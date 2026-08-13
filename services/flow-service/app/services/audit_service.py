from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent
from app.schemas.audit_event import AuditEventCreate, AuditEventRead


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record(self, event_create: AuditEventCreate) -> AuditEvent:
        event = AuditEvent(
            workspace_id=event_create.workspace_id,
            project_id=event_create.project_id,
            work_item_id=event_create.work_item_id,
            entity_type=event_create.entity_type,
            entity_id=event_create.entity_id,
            action=event_create.action,
            actor_id=event_create.actor_id,
            actor_name=event_create.actor_name,
            old_value=event_create.old_value,
            new_value=event_create.new_value,
            metadata_json=event_create.metadata,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list(
        self,
        *,
        project_id: int | None = None,
        work_item_id: int | None = None,
        actor_id: int | None = None,
        action: str | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[AuditEventRead]:
        statement = select(AuditEvent)
        if project_id is not None:
            statement = statement.where(AuditEvent.project_id == project_id)
        if work_item_id is not None:
            statement = statement.where(AuditEvent.work_item_id == work_item_id)
        if actor_id is not None:
            statement = statement.where(AuditEvent.actor_id == actor_id)
        if action:
            statement = statement.where(AuditEvent.action == action)
        if created_from is not None:
            statement = statement.where(AuditEvent.created_at >= created_from)
        if created_to is not None:
            statement = statement.where(AuditEvent.created_at <= created_to)
        if search:
            pattern = f"%{search}%"
            statement = statement.where(
                AuditEvent.action.ilike(pattern)
                | AuditEvent.entity_type.ilike(pattern)
                | AuditEvent.entity_id.ilike(pattern)
                | AuditEvent.actor_name.ilike(pattern)
                | AuditEvent.old_value.ilike(pattern)
                | AuditEvent.new_value.ilike(pattern)
            )
        statement = statement.order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc()).offset(offset).limit(limit)
        return [self.to_read(event) for event in self.db.scalars(statement).all()]

    @staticmethod
    def to_read(event: AuditEvent) -> AuditEventRead:
        return AuditEventRead(
            id=event.id,
            workspace_id=event.workspace_id,
            project_id=event.project_id,
            work_item_id=event.work_item_id,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            action=event.action,
            actor_id=event.actor_id,
            actor_name=event.actor_name,
            old_value=event.old_value,
            new_value=event.new_value,
            metadata=event.metadata_json,
            created_at=event.created_at,
        )
