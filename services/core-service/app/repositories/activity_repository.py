from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.organization import OrganizationMember
from app.models.project import Project
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.activity_log import ActivityLogFilter


class ActivityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, activity_id: int) -> ActivityLog | None:
        return self.db.get(ActivityLog, activity_id)

    def list(self, filters: ActivityLogFilter) -> list[ActivityLog]:
        statement = select(ActivityLog).order_by(ActivityLog.created_at.desc())
        if filters.entity_type:
            statement = statement.where(ActivityLog.entity_type == filters.entity_type)
        if filters.action:
            statement = statement.where(ActivityLog.action == filters.action)
        if filters.organization_id is not None:
            statement = statement.where(ActivityLog.organization_id == filters.organization_id)
        if filters.workspace_id is not None:
            statement = statement.where(ActivityLog.workspace_id == filters.workspace_id)
        if filters.project_id is not None:
            statement = statement.where(ActivityLog.project_id == filters.project_id)
        if filters.actor_user_id is not None:
            statement = statement.where(ActivityLog.actor_user_id == filters.actor_user_id)
        statement = statement.limit(filters.limit).offset(filters.offset)
        return list(self.db.scalars(statement).all())

    def list_for_user(self, user_id: int, limit: int, offset: int, *, unscoped_only: bool = False) -> list[ActivityLog]:
        statement = select(ActivityLog).where(ActivityLog.actor_user_id == user_id).order_by(ActivityLog.created_at.desc())
        if unscoped_only:
            statement = statement.where(
                ActivityLog.organization_id.is_(None),
                ActivityLog.workspace_id.is_(None),
                ActivityLog.project_id.is_(None),
            )
        statement = statement.limit(limit).offset(offset)
        return list(self.db.scalars(statement).all())

    def create(
        self,
        *,
        actor_user_id: int | None,
        organization_id: int | None,
        workspace_id: int | None,
        project_id: int | None,
        entity_type: str,
        entity_id: str | None,
        action: str,
        description: str | None,
        metadata: dict | None,
    ) -> ActivityLog:
        activity = ActivityLog(
            actor_user_id=actor_user_id,
            organization_id=organization_id,
            workspace_id=workspace_id,
            project_id=project_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            description=description,
            summary=description,
            event_metadata=metadata,
        )
        self.db.add(activity)
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def is_organization_member(self, organization_id: int, user_id: int) -> bool:
        statement = select(OrganizationMember.id).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def is_workspace_member(self, workspace_id: int, user_id: int) -> bool:
        statement = select(WorkspaceMember.id).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def get_workspace(self, workspace_id: int) -> Workspace | None:
        return self.db.get(Workspace, workspace_id)

    def get_project(self, project_id: int) -> Project | None:
        return self.db.get(Project, project_id)
