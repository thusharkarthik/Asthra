from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import NotificationCreateInternal, NotificationFilter


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, notification_create: NotificationCreateInternal) -> Notification:
        notification = Notification(**notification_create.model_dump())
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_for_user(self, notification_id: int, user_id: int) -> Notification | None:
        statement = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        return self.db.scalar(statement)

    def list_for_user(self, user_id: int, filters: NotificationFilter) -> list[Notification]:
        statement = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        if filters.is_read is not None:
            statement = statement.where(Notification.is_read.is_(filters.is_read))
        if filters.type:
            statement = statement.where(Notification.type == filters.type)
        if filters.organization_id is not None:
            statement = statement.where(Notification.organization_id == filters.organization_id)
        if filters.workspace_id is not None:
            statement = statement.where(Notification.workspace_id == filters.workspace_id)
        if filters.project_id is not None:
            statement = statement.where(Notification.project_id == filters.project_id)
        statement = statement.limit(filters.limit).offset(filters.offset)
        return list(self.db.scalars(statement).all())

    def mark_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_read(self, user_id: int) -> int:
        notifications = self.db.scalars(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        ).all()
        now = datetime.now(timezone.utc)
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
        self.db.commit()
        return len(notifications)

    def delete(self, notification: Notification) -> None:
        self.db.delete(notification)
        self.db.commit()
