from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import EventDeliveryLog, EventRecord, EventSubscription


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> EventRecord:
        item = EventRecord(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get_by_event_id(self, event_id: str) -> EventRecord | None:
        return self.db.query(EventRecord).filter(EventRecord.event_id == event_id).first()

    def list(
        self,
        event_name: str | None = None,
        source_service: str | None = None,
        workspace_id: int | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[EventRecord]:
        query = self.db.query(EventRecord)
        if event_name is not None:
            query = query.filter(EventRecord.event_name == event_name)
        if source_service is not None:
            query = query.filter(EventRecord.source_service == source_service)
        if workspace_id is not None:
            query = query.filter(EventRecord.workspace_id == workspace_id)
        if entity_type is not None:
            query = query.filter(EventRecord.entity_type == entity_type)
        if entity_id is not None:
            query = query.filter(EventRecord.entity_id == entity_id)
        return query.order_by(EventRecord.occurred_at.desc()).offset(offset).limit(limit).all()


class SubscriptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> EventSubscription:
        item = EventSubscription(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get(self, subscription_id: int) -> EventSubscription | None:
        return self.db.get(EventSubscription, subscription_id)

    def list(self, workspace_id: int | None = None, is_active: bool | None = None, limit: int = 100, offset: int = 0):
        query = self.db.query(EventSubscription)
        if workspace_id is not None:
            query = query.filter(EventSubscription.workspace_id == workspace_id)
        if is_active is not None:
            query = query.filter(EventSubscription.is_active == is_active)
        return query.order_by(EventSubscription.id.desc()).offset(offset).limit(limit).all()

    def list_active_for_workspace(self, workspace_id: int | None = None) -> list[EventSubscription]:
        query = self.db.query(EventSubscription).filter(EventSubscription.is_active.is_(True))
        if workspace_id is not None:
            query = query.filter((EventSubscription.workspace_id == workspace_id) | (EventSubscription.workspace_id.is_(None)))
        return query.all()

    def update(self, item: EventSubscription, data: dict) -> EventSubscription:
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: EventSubscription) -> None:
        self.db.delete(item)
        self.db.commit()


class DeliveryLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> EventDeliveryLog:
        item = EventDeliveryLog(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list(
        self,
        delivery_status: str | None = None,
        subscription_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[EventDeliveryLog]:
        query = self.db.query(EventDeliveryLog)
        if delivery_status is not None:
            query = query.filter(EventDeliveryLog.delivery_status == delivery_status)
        if subscription_id is not None:
            query = query.filter(EventDeliveryLog.subscription_id == subscription_id)
        return query.order_by(EventDeliveryLog.id.desc()).offset(offset).limit(limit).all()
