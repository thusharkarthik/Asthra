from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.repositories import DeliveryLogRepository, EventRepository, SubscriptionRepository
from app.schemas import EventRecordCreate, EventSubscriptionCreate, EventSubscriptionUpdate


def event_matches_pattern(event_name: str, pattern: str) -> bool:
    if pattern == "*":
        return True
    if pattern.endswith(".*"):
        return event_name.startswith(pattern[:-1])
    return event_name == pattern


class EventService:
    def __init__(self, db: Session):
        self.event_repo = EventRepository(db)
        self.subscription_repo = SubscriptionRepository(db)
        self.delivery_repo = DeliveryLogRepository(db)

    def publish(self, data: EventRecordCreate):
        existing = self.event_repo.get_by_event_id(data.event_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="event_id already exists.")

        event = self.event_repo.create(data.model_dump())
        subscriptions = self.subscription_repo.list_active_for_workspace(event.workspace_id)
        for subscription in subscriptions:
            if event_matches_pattern(event.event_name, subscription.event_pattern):
                self.delivery_repo.create(
                    {
                        "event_record_id": event.id,
                        "subscription_id": subscription.id,
                        "delivery_status": "pending",
                    }
                )
        return event

    def list_events(self, **filters):
        return self.event_repo.list(**filters)

    def get_event(self, event_id: str):
        event = self.event_repo.get_by_event_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
        return event


class SubscriptionService:
    def __init__(self, db: Session):
        self.repo = SubscriptionRepository(db)

    def create(self, data: EventSubscriptionCreate):
        return self.repo.create(data.model_dump())

    def list(self, workspace_id: int | None = None, is_active: bool | None = None, limit: int = 100, offset: int = 0):
        return self.repo.list(workspace_id=workspace_id, is_active=is_active, limit=limit, offset=offset)

    def update(self, subscription_id: int, data: EventSubscriptionUpdate):
        item = self.repo.get(subscription_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
        return self.repo.update(item, data.model_dump(exclude_unset=True))

    def delete(self, subscription_id: int):
        item = self.repo.get(subscription_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
        self.repo.delete(item)


class DeliveryLogService:
    def __init__(self, db: Session):
        self.repo = DeliveryLogRepository(db)

    def list(self, delivery_status: str | None = None, subscription_id: int | None = None, limit: int = 100, offset: int = 0):
        return self.repo.list(
            delivery_status=delivery_status,
            subscription_id=subscription_id,
            limit=limit,
            offset=offset,
        )
