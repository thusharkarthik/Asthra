from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.flow_notification import FlowNotification
from app.models.work_item import WorkItem


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_for_work_item(
        self,
        *,
        work_item: WorkItem,
        notification_type: str,
        title: str,
        message: str,
        user_id: int | None = None,
        workspace_id: int | None = None,
    ) -> FlowNotification:
        notification = FlowNotification(
            workspace_id=workspace_id,
            project_id=work_item.project_id,
            user_id=user_id,
            work_item_id=work_item.id,
            notification_type=notification_type,
            title=title,
            message=message,
            is_read=False,
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def list(
        self,
        *,
        workspace_id: int | None = None,
        project_id: int | None = None,
        user_id: int | None = None,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[FlowNotification]:
        statement = select(FlowNotification)
        if workspace_id is not None:
            statement = statement.where(FlowNotification.workspace_id == workspace_id)
        if project_id is not None:
            statement = statement.where(FlowNotification.project_id == project_id)
        if user_id is not None:
            statement = statement.where(FlowNotification.user_id == user_id)
        if unread_only:
            statement = statement.where(FlowNotification.is_read.is_(False))
        statement = statement.order_by(FlowNotification.created_at.desc(), FlowNotification.id.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(statement).all())

    def mark_read(self, notification_id: int) -> FlowNotification:
        notification = self._get(notification_id)
        notification.is_read = True
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_read(
        self,
        *,
        workspace_id: int | None = None,
        project_id: int | None = None,
        user_id: int | None = None,
    ) -> list[FlowNotification]:
        notifications = self.list(
            workspace_id=workspace_id,
            project_id=project_id,
            user_id=user_id,
            unread_only=True,
            limit=500,
        )
        for notification in notifications:
            notification.is_read = True
            self.db.add(notification)
        self.db.commit()
        for notification in notifications:
            self.db.refresh(notification)
        return notifications

    def delete(self, notification_id: int) -> None:
        notification = self._get(notification_id)
        self.db.delete(notification)
        self.db.commit()

    def _get(self, notification_id: int) -> FlowNotification:
        notification = self.db.get(FlowNotification, notification_id)
        if notification is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        return notification
