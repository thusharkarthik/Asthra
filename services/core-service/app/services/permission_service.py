from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.schemas.role import PermissionCreate, PermissionUpdate
from app.services.activity_service import ActivityService

VALID_PERMISSION_STATUSES = {"active", "inactive", "deprecated"}

CORE_PERMISSION_CATALOG = [
    ("settings.organization.view", "View organizations", "View organization settings and hierarchy.", "settings", "organization"),
    ("settings.organization.manage", "Manage organizations", "Create and update organization settings.", "settings", "organization"),
    ("settings.workspace.view", "View workspaces", "View workspace settings and context.", "settings", "workspace"),
    ("settings.workspace.manage", "Manage workspaces", "Create and update workspace settings.", "settings", "workspace"),
    ("settings.project.view", "View projects", "View project settings and membership context.", "settings", "project"),
    ("settings.project.manage", "Manage projects", "Create and update project settings.", "settings", "project"),
    ("settings.member.view", "View members", "View organization and workspace members.", "settings", "workspace"),
    ("settings.member.invite", "Invite members", "Invite users into organizations and workspaces.", "settings", "workspace"),
    ("settings.member.remove", "Remove members", "Remove users from organizations and workspaces.", "settings", "workspace"),
    ("settings.role.view", "View roles", "View access-control roles.", "settings", "organization"),
    ("settings.role.manage", "Manage roles", "Create and update custom roles.", "settings", "organization"),
    ("settings.permission.view", "View permissions", "View the permission catalog.", "settings", "organization"),
    ("settings.permission.manage", "Manage permissions", "Create and update custom permissions.", "settings", "organization"),
    ("settings.team.view", "View teams", "View workspace teams.", "settings", "workspace"),
    ("settings.team.manage", "Manage teams", "Create and manage workspace teams.", "settings", "workspace"),
    ("flow.work_item.view", "View work items", "View Flow work items.", "flow", "project"),
    ("flow.work_item.create", "Create work items", "Create Flow work items.", "flow", "project"),
    ("flow.work_item.edit", "Edit work items", "Update Flow work items.", "flow", "project"),
    ("flow.work_item.delete", "Delete work items", "Delete or archive Flow work items.", "flow", "project"),
    ("flow.work_item.assign", "Assign work items", "Assign Flow work items to users.", "flow", "project"),
    ("flow.board.view", "View boards", "View Flow boards.", "flow", "project"),
    ("flow.sprint.view", "View Flow sprints", "View Flow sprint plans and execution.", "flow", "project"),
    ("flow.sprint.manage", "Manage Flow sprints", "Create and manage Flow sprints.", "flow", "project"),
    ("flow.release.view", "View Flow releases", "View Flow release plans and progress.", "flow", "project"),
    ("flow.release.manage", "Manage Flow releases", "Create and manage Flow releases.", "flow", "project"),
    ("flow.workflow.view", "View Flow workflows", "View Flow workflow definitions.", "flow", "project"),
    ("flow.workflow.manage", "Manage Flow workflows", "Create and update Flow workflows.", "flow", "project"),
    ("flow.report.view", "View Flow reports", "View Flow reports and summaries.", "flow", "project"),
    ("docs.space.view", "View Docs spaces", "View knowledge spaces.", "docs", "workspace"),
    ("docs.space.manage", "Manage Docs spaces", "Create and update knowledge spaces.", "docs", "workspace"),
    ("docs.page.view", "View Docs pages", "View knowledge pages.", "docs", "workspace"),
    ("docs.page.create", "Create Docs pages", "Create knowledge pages.", "docs", "workspace"),
    ("docs.page.edit", "Edit Docs pages", "Update knowledge pages.", "docs", "workspace"),
    ("docs.page.delete", "Delete Docs pages", "Delete or archive knowledge pages.", "docs", "workspace"),
    ("discover.idea.view", "View ideas", "View Discover ideas.", "discover", "workspace"),
    ("discover.idea.manage", "Manage ideas", "Create and update Discover ideas.", "discover", "workspace"),
    ("desk.ticket.view", "View Desk tickets", "View support tickets.", "desk", "workspace"),
    ("desk.ticket.manage", "Manage Desk tickets", "Create and update support tickets.", "desk", "workspace"),
    ("pulse.incident.view", "View incidents", "View Pulse incidents.", "pulse", "workspace"),
    ("pulse.incident.manage", "Manage incidents", "Create and update Pulse incidents.", "pulse", "workspace"),
    ("dev.release.view", "View Dev releases", "View Dev releases.", "dev", "workspace"),
    ("dev.release.manage", "Manage Dev releases", "Create and update Dev releases.", "dev", "workspace"),
    ("automation.rule.view", "View automation rules", "View automation rules.", "automation", "workspace"),
    ("automation.rule.manage", "Manage automation rules", "Create and update automation rules.", "automation", "workspace"),
    ("guard.audit.view", "View audit records", "View governance and audit records.", "guard", "organization"),
    ("insights.report.view", "View Insights reports", "View analytics reports.", "insights", "workspace"),
    ("media.asset.view", "View media assets", "View media assets.", "media", "workspace"),
    ("media.asset.manage", "Manage media assets", "Create and update media assets.", "media", "workspace"),
]


class PermissionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.permission_repository = PermissionRepository(db)

    def create(self, permission_create: PermissionCreate, current_user: User) -> Permission:
        self._ensure_active_user(current_user)
        code = self._normalize_code(permission_create.code)
        self._validate_status(permission_create.status)
        if self.permission_repository.get_by_code(code) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A permission with this code already exists.",
            )
        permission = self.permission_repository.create(
            code=code,
            name=permission_create.name.strip(),
            description=permission_create.description,
            module=permission_create.module,
            scope=permission_create.scope,
            status=permission_create.status,
        )
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            entity_type="permission",
            entity_id=str(permission.id),
            action="permission.created",
            description=f"Permission '{permission.code}' was created.",
        )
        return permission

    def list(self, current_user: User) -> list[Permission]:
        self._ensure_active_user(current_user)
        self.ensure_permission_catalog()
        return self.permission_repository.list()

    def get(self, permission_id: int, current_user: User) -> Permission:
        self._ensure_active_user(current_user)
        permission = self.permission_repository.get_by_id(permission_id)
        if permission is None or not permission.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
        return permission

    def update(
        self,
        permission_id: int,
        permission_update: PermissionUpdate,
        current_user: User,
    ) -> Permission:
        permission = self.get(permission_id, current_user)
        if permission_update.code is not None:
            permission_update.code = self._normalize_code(permission_update.code)
            duplicate = self.permission_repository.get_by_code(permission_update.code)
            if duplicate is not None and duplicate.id != permission.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A permission with this code already exists.",
                )
        if permission_update.name is not None:
            permission_update.name = permission_update.name.strip()
        if permission_update.status is not None:
            self._validate_status(permission_update.status)
        return self.permission_repository.update(permission, permission_update)

    def delete(self, permission_id: int, current_user: User) -> None:
        permission = self.get(permission_id, current_user)
        self.permission_repository.update(permission, PermissionUpdate(status="inactive", is_active=False))

    def ensure_permission_catalog(self) -> None:
        for code, name, description, module, scope in CORE_PERMISSION_CATALOG:
            existing = self.permission_repository.get_by_code(code)
            if existing is not None:
                changed = False
                if existing.module != module:
                    existing.module = module
                    changed = True
                if existing.scope != scope:
                    existing.scope = scope
                    changed = True
                if existing.status != "active":
                    existing.status = "active"
                    existing.is_active = True
                    changed = True
                if not existing.description:
                    existing.description = description
                    changed = True
                if changed:
                    self.db.commit()
                continue
            self.permission_repository.create(
                code=code,
                name=name,
                description=description,
                module=module,
                scope=scope,
                status="active",
            )

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _normalize_code(self, code: str) -> str:
        return code.strip().lower()

    def _validate_status(self, value: str) -> None:
        if value not in VALID_PERMISSION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Permission status must be active, inactive, or deprecated.",
            )
