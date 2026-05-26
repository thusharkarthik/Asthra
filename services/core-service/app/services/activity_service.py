from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.user import User
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity_log import ActivityLogFilter


class ActivityService:
    def __init__(self, db: Session) -> None:
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
        if not current_user.is_superuser and current_user.id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid activity access.")
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
        if filters.project_id is not None:
            project = self.activity_repository.get_project(filters.project_id)
            if project is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
            self._ensure_workspace_access(project.workspace_id, user)
        if filters.workspace_id is not None:
            self._ensure_workspace_access(filters.workspace_id, user)
        if filters.organization_id is not None:
            self._ensure_organization_access(filters.organization_id, user)
        if (
            filters.project_id is None
            and filters.workspace_id is None
            and filters.organization_id is None
            and filters.actor_user_id is not None
            and filters.actor_user_id != user.id
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid activity access.")

    def _ensure_activity_access(self, activity: ActivityLog, user: User) -> None:
        if user.is_superuser:
            return
        if activity.project_id is not None:
            project = self.activity_repository.get_project(activity.project_id)
            if project is not None:
                self._ensure_workspace_access(project.workspace_id, user)
                return
        if activity.workspace_id is not None:
            self._ensure_workspace_access(activity.workspace_id, user)
            return
        if activity.organization_id is not None:
            self._ensure_organization_access(activity.organization_id, user)
            return
        if activity.actor_user_id == user.id:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid activity access.")

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
