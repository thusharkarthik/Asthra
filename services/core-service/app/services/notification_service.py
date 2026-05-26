from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreateInternal, NotificationFilter
from app.services.activity_service import ActivityService


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.notification_repository = NotificationRepository(db)

    def create_notification(
        self,
        *,
        user_id: int,
        type: str,
        title: str,
        message: str,
        organization_id: int | None = None,
        workspace_id: int | None = None,
        project_id: int | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
    ) -> Notification:
        return self.notification_repository.create(
            NotificationCreateInternal(
                user_id=user_id,
                type=type,
                title=title,
                message=message,
                organization_id=organization_id,
                workspace_id=workspace_id,
                project_id=project_id,
                entity_type=entity_type,
                entity_id=entity_id,
            )
        )

    def list(self, filters: NotificationFilter, current_user: User) -> list[Notification]:
        self._ensure_active_user(current_user)
        return self.notification_repository.list_for_user(current_user.id, filters)

    def get(self, notification_id: int, current_user: User) -> Notification:
        self._ensure_active_user(current_user)
        notification = self.notification_repository.get_for_user(notification_id, current_user.id)
        if notification is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        return notification

    def mark_read(self, notification_id: int, current_user: User) -> Notification:
        notification = self.get(notification_id, current_user)
        notification = self.notification_repository.mark_read(notification)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=notification.organization_id,
            workspace_id=notification.workspace_id,
            project_id=notification.project_id,
            entity_type="notification",
            entity_id=str(notification.id),
            action="notification.read",
            description=f"Notification {notification.id} was marked read.",
        )
        return notification

    def mark_all_read(self, current_user: User) -> dict[str, int]:
        self._ensure_active_user(current_user)
        count = self.notification_repository.mark_all_read(current_user.id)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            entity_type="notification",
            action="notification.all_read",
            description=f"{count} notifications were marked read.",
            metadata={"count": count},
        )
        return {"updated": count}

    def delete(self, notification_id: int, current_user: User) -> None:
        notification = self.get(notification_id, current_user)
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=notification.organization_id,
            workspace_id=notification.workspace_id,
            project_id=notification.project_id,
            entity_type="notification",
            entity_id=str(notification.id),
            action="notification.deleted",
            description=f"Notification {notification.id} was deleted.",
        )
        self.notification_repository.delete(notification)

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")
