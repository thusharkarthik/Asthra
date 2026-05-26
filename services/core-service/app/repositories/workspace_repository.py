from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.organization import Organization
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceUpdate


class WorkspaceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def organization_exists(self, organization_id: int) -> bool:
        statement = select(Organization.id).where(Organization.id == organization_id)
        return self.db.scalar(statement) is not None

    def get_by_id(self, workspace_id: int) -> Workspace | None:
        return self.db.get(Workspace, workspace_id)

    def get_by_org_and_slug(self, organization_id: int, slug: str) -> Workspace | None:
        statement = select(Workspace).where(
            Workspace.organization_id == organization_id,
            Workspace.slug == slug,
        )
        return self.db.scalar(statement)

    def list_for_user(self, user_id: int, *, include_inactive: bool = False) -> list[Workspace]:
        statement = (
            select(Workspace)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .where(WorkspaceMember.user_id == user_id)
            .order_by(Workspace.created_at.desc())
        )
        if not include_inactive:
            statement = statement.where(Workspace.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def list_all(self, *, include_inactive: bool = False) -> list[Workspace]:
        statement = select(Workspace).order_by(Workspace.created_at.desc())
        if not include_inactive:
            statement = statement.where(Workspace.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def is_member(self, workspace_id: int, user_id: int) -> bool:
        statement = select(WorkspaceMember.id).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def create_with_owner(
        self,
        *,
        organization_id: int,
        name: str,
        slug: str,
        description: str | None,
        created_by_id: int,
    ) -> Workspace:
        workspace = Workspace(
            organization_id=organization_id,
            name=name,
            slug=slug,
            description=description,
            created_by_id=created_by_id,
        )
        self.db.add(workspace)
        self.db.flush()

        self.db.add(
            WorkspaceMember(
                workspace_id=workspace.id,
                user_id=created_by_id,
                member_role="owner",
            )
        )
        self.db.add(
            ActivityLog(
                actor_user_id=created_by_id,
                organization_id=organization_id,
                workspace_id=workspace.id,
                action="workspace.created",
                entity_type="workspace",
                entity_id=str(workspace.id),
                summary=f"Workspace '{workspace.name}' was created.",
            )
        )
        self.db.commit()
        self.db.refresh(workspace)
        return workspace

    def update(self, workspace: Workspace, workspace_update: WorkspaceUpdate) -> Workspace:
        update_data = workspace_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(workspace, field, value)
        self.db.commit()
        self.db.refresh(workspace)
        return workspace

    def list_members(self, workspace_id: int) -> list[WorkspaceMember]:
        statement = (
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .order_by(WorkspaceMember.created_at.asc())
        )
        return list(self.db.scalars(statement).all())
