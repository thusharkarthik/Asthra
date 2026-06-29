from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.repositories.notification_repository import NotificationRepository
from app.repositories.user_repository import UserRepository
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

    def send_access_request(self, page: str, message: str | None, current_user: User) -> dict:
        """Create an 'Access Request' notification for the appropriate admin."""
        self._ensure_active_user(current_user)
        admin_user_id = self._find_admin_for_user(current_user)
        if admin_user_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No admin found to notify. Please contact your platform administrator directly.",
            )
        user_name = current_user.full_name or current_user.email
        notification_message = f"{user_name} is requesting access to: {page}."
        if message:
            notification_message += f' Their message: "{message}"'
        self.create_notification(
            user_id=admin_user_id,
            type="access_request",
            title="Access Request",
            message=notification_message,
            entity_type="user_profile",
            entity_id=str(current_user.id),
        )
        return {"sent": True}

    def _find_admin_for_user(self, current_user: User) -> int | None:
        """Priority: org admin → platform admin → superuser."""
        # Priority 1: org admin/owner in any of the user's organizations
        org_ids_rows = (
            self.db.query(RoleAssignment.scope_id)
            .filter(
                RoleAssignment.user_id == current_user.id,
                RoleAssignment.scope_type == "organization",
                RoleAssignment.status == "active",
                RoleAssignment.scope_id.isnot(None),
            )
            .all()
        )
        org_ids = [row.scope_id for row in org_ids_rows]
        if org_ids:
            org_admin_assignment = (
                self.db.query(RoleAssignment)
                .join(Role, RoleAssignment.role_id == Role.id)
                .filter(
                    RoleAssignment.scope_type == "organization",
                    RoleAssignment.scope_id.in_(org_ids),
                    RoleAssignment.status == "active",
                    RoleAssignment.user_id != current_user.id,
                    Role.key.in_(["organization_owner", "organization_admin"]),
                    Role.is_active.is_(True),
                )
                .first()
            )
            if org_admin_assignment is not None:
                return org_admin_assignment.user_id

        # Priority 2: platform admin/owner
        platform_assignment = (
            self.db.query(RoleAssignment)
            .join(Role, RoleAssignment.role_id == Role.id)
            .filter(
                RoleAssignment.scope_type == "platform",
                RoleAssignment.status == "active",
                RoleAssignment.user_id != current_user.id,
                Role.key.in_(["platform_owner", "platform_admin"]),
                Role.is_active.is_(True),
            )
            .first()
        )
        if platform_assignment is not None:
            return platform_assignment.user_id

        # Priority 3: any active superuser
        superuser = (
            self.db.query(User)
            .filter(
                User.is_superuser.is_(True),
                User.is_active.is_(True),
                User.id != current_user.id,
            )
            .first()
        )
        if superuser is not None:
            return superuser.id

        return None

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")
