from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.user import User
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity_log import ActivityLogFilter


class ActivityService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.activity_repository = ActivityRepository(db)

    def log_activity(
        self,
        *,
        actor_user_id: int | None,
        entity_type: str,
        action: str,
        entity_id: str | None = None,
        organization_id: int | None = None,
        workspace_id: int | None = None,
        project_id: int | None = None,
        description: str | None = None,
        metadata: dict | None = None,
    ) -> ActivityLog:
        return self.activity_repository.create(
            actor_user_id=actor_user_id,
            organization_id=organization_id,
            workspace_id=workspace_id,
            project_id=project_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            description=description,
            metadata=metadata,
        )

    def list(self, filters: ActivityLogFilter, current_user: User) -> list[ActivityLog]:
        self._ensure_active_user(current_user)
        self._ensure_filter_access(filters, current_user)
        return self.activity_repository.list(filters)

    def get(self, activity_id: int, current_user: User) -> ActivityLog:
        self._ensure_active_user(current_user)
        activity = self.activity_repository.get_by_id(activity_id)
        if activity is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")
        self._ensure_activity_access(activity, current_user)
        return activity

    def list_for_user(
        self,
        user_id: int,
        *,
        limit: int,
        offset: int,
        current_user: User,
    ) -> list[ActivityLog]:
        self._ensure_active_user(current_user)
        if current_user.is_superuser:
            return self.activity_repository.list_for_user(user_id, limit, offset)
        if current_user.id == user_id:
            return self.activity_repository.list_for_user(user_id, limit, offset, unscoped_only=True)
        self._require_audit_permission(current_user, "platform", None)
        return self.activity_repository.list_for_user(user_id, limit, offset)

    def list_for_organization(
        self,
        organization_id: int,
        *,
        limit: int,
        offset: int,
        current_user: User,
    ) -> list[ActivityLog]:
        filters = ActivityLogFilter(organization_id=organization_id, limit=limit, offset=offset)
        return self.list(filters, current_user)

    def list_for_workspace(
        self,
        workspace_id: int,
        *,
        limit: int,
        offset: int,
        current_user: User,
    ) -> list[ActivityLog]:
        filters = ActivityLogFilter(workspace_id=workspace_id, limit=limit, offset=offset)
        return self.list(filters, current_user)

    def list_for_project(
        self,
        project_id: int,
        *,
        limit: int,
        offset: int,
        current_user: User,
    ) -> list[ActivityLog]:
        filters = ActivityLogFilter(project_id=project_id, limit=limit, offset=offset)
        return self.list(filters, current_user)

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    def _ensure_filter_access(self, filters: ActivityLogFilter, user: User) -> None:
        if user.is_superuser:
            return
        scope_type, scope_id = self._scope_for_filters(filters)
        self._require_audit_permission(user, scope_type, scope_id)

    def _ensure_activity_access(self, activity: ActivityLog, user: User) -> None:
        if user.is_superuser:
            return
        if activity.actor_user_id == user.id and activity.project_id is None and activity.workspace_id is None and activity.organization_id is None:
            return
        scope_type, scope_id = self._scope_for_activity(activity)
        self._require_audit_permission(user, scope_type, scope_id)

    def _require_audit_permission(self, user: User, scope_type: str, scope_id: int | None) -> None:
        from app.services.access_control_service import AccessControlService

        AccessControlService(self.db).require(user, "guard.audit.view", scope_type, scope_id)

    def _scope_for_filters(self, filters: ActivityLogFilter) -> tuple[str, int | None]:
        if filters.project_id is not None:
            return "project", filters.project_id
        if filters.workspace_id is not None:
            return "workspace", filters.workspace_id
        if filters.organization_id is not None:
            return "organization", filters.organization_id
        return "platform", None

    def _scope_for_activity(self, activity: ActivityLog) -> tuple[str, int | None]:
        if activity.project_id is not None:
            return "project", activity.project_id
        if activity.workspace_id is not None:
            return "workspace", activity.workspace_id
        if activity.organization_id is not None:
            return "organization", activity.organization_id
        return "platform", None

    def _ensure_workspace_access(self, workspace_id: int, user: User) -> None:
        workspace = self.activity_repository.get_workspace(workspace_id)
        if workspace is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
        if workspace.created_by_id == user.id:
            return
        if self.activity_repository.is_workspace_member(workspace_id, user.id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid activity access.")

    def _ensure_organization_access(self, organization_id: int, user: User) -> None:
        if self.activity_repository.is_organization_member(organization_id, user.id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid activity access.")
