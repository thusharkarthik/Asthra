from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.role import Role, RolePermission
from app.models.user import User, UserRole
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.role import RoleCreate, RolePermissionCreate, RolePermissionsReplace, RoleUpdate, UserRoleCreate
from app.services.activity_service import ActivityService
from app.services.notification_service import NotificationService


VALID_ROLE_SCOPES = {"global", "platform", "organization", "workspace", "project", "team", "functional"}

ASTHRA_ROLE_CATALOG = [
    ("Platform Owner", "platform_owner", "platform", "Full platform administration and future billing ownership."),
    ("Platform Admin", "platform_admin", "platform", "Platform administration without owner-only protections."),
    ("Platform Support", "platform_support", "Support operational access for platform assistance."),
    ("Organization Owner", "organization_owner", "organization", "Full organization administration and last-owner protected access."),
    ("Organization Admin", "organization_admin", "organization", "Manage organization settings, workspaces, and members."),
    ("Organization Auditor", "organization_auditor", "organization", "Read organization settings and audit data."),
    ("Workspace Admin", "workspace_admin", "workspace", "Manage workspace settings, projects, and members."),
    ("Workspace Manager", "workspace_manager", "workspace", "Manage workspace execution and project delivery."),
    ("Workspace Member", "workspace_member", "workspace", "Create and edit workspace/project work."),
    ("Workspace Viewer", "workspace_viewer", "workspace", "Read-only workspace access."),
    ("Project Admin", "project_admin", "project", "Manage project settings, members, and work."),
    ("Project Manager", "project_manager", "project", "Manage project plans, sprints, releases, and delivery."),
    ("Project Contributor", "project_contributor", "project", "Contribute work and comments in a project."),
    ("Project Viewer", "project_viewer", "project", "Read-only project access."),
    ("Team Lead", "team_lead", "team", "Manage team members and team-owned work."),
    ("Team Member", "team_member", "team", "Participate in team-owned work."),
    ("Team Observer", "team_observer", "team", "Read team activity and work."),
    ("Product Owner", "product_owner", "functional", "Own product priorities and acceptance decisions."),
    ("Scrum Master", "scrum_master", "functional", "Facilitate sprint execution and team ceremonies."),
    ("Engineering Manager", "engineering_manager", "functional", "Manage engineering team delivery and ownership."),
    ("Release Manager", "release_manager", "functional", "Coordinate release planning and rollout readiness."),
    ("Incident Commander", "incident_commander", "functional", "Coordinate incident response and communications."),
    ("Knowledge Manager", "knowledge_manager", "functional", "Manage knowledge quality and documentation practices."),
]


class RoleService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.role_repository = RoleRepository(db)
        self.permission_repository = PermissionRepository(db)

    def create(self, role_create: RoleCreate, current_user: User) -> Role:
        self._ensure_active_user(current_user)
        scope = self._validate_scope(role_create.scope)
        name = role_create.name.strip()
        if self.role_repository.get_by_scope_and_name(scope, name) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A role with this name already exists in this scope.",
            )
        role = self.role_repository.create(
            name=name,
            key=self._keyify(name),
            description=role_create.description,
            scope=scope,
            organization_id=role_create.organization_id,
            is_system=role_create.is_system,
            is_editable=role_create.is_editable,
        )
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=role.organization_id,
            entity_type="role",
            entity_id=str(role.id),
            action="role.created",
            description=f"Role '{role.name}' was created.",
        )
        return role

    def list(self, current_user: User) -> list[Role]:
        self._ensure_active_user(current_user)
        self.ensure_role_catalog()
        return self.role_repository.list()

    def get(self, role_id: int, current_user: User) -> Role:
        self._ensure_active_user(current_user)
        role = self.role_repository.get_by_id(role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        return role

    def update(self, role_id: int, role_update: RoleUpdate, current_user: User) -> Role:
        role = self.get(role_id, current_user)
        if not role.is_editable:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System role is not editable.")
        if role_update.scope is not None:
            role_update.scope = self._validate_scope(role_update.scope)
        name = role_update.name.strip() if role_update.name is not None else role.name
        scope = role_update.scope if role_update.scope is not None else role.scope
        duplicate = self.role_repository.get_by_scope_and_name(scope, name)
        if duplicate is not None and duplicate.id != role.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A role with this name already exists in this scope.",
            )
        return self.role_repository.update(role, role_update)

    def delete(self, role_id: int, current_user: User) -> None:
        role = self.get(role_id, current_user)
        if not role.is_editable:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System role is not editable.")
        self.role_repository.update(role, RoleUpdate(is_active=False))

    def link_permission(
        self,
        role_id: int,
        link_create: RolePermissionCreate,
        current_user: User,
    ) -> RolePermission:
        role = self.get(role_id, current_user)
        permission = self.permission_repository.get_by_id(link_create.permission_id)
        if permission is None or not permission.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
        if self.role_repository.get_role_permission(role.id, permission.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Permission is already linked to this role.",
            )
        return self.role_repository.link_permission(role.id, permission.id)

    def list_permissions(self, role_id: int, current_user: User) -> list[RolePermission]:
        role = self.get(role_id, current_user)
        return self.role_repository.list_permissions(role.id)

    def replace_permissions(
        self,
        role_id: int,
        replace_create: RolePermissionsReplace,
        current_user: User,
    ) -> list[RolePermission]:
        role = self.get(role_id, current_user)
        if not role.is_editable:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System role is not editable.")
        permission_ids = list(dict.fromkeys(replace_create.permission_ids))
        for permission_id in permission_ids:
            permission = self.permission_repository.get_by_id(permission_id)
            if permission is None or not permission.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Permission {permission_id} not found.")
        return self.role_repository.replace_permissions(role.id, permission_ids)

    def unlink_permission(self, role_id: int, permission_id: int, current_user: User) -> None:
        role = self.get(role_id, current_user)
        role_permission = self.role_repository.get_role_permission(role.id, permission_id)
        if role_permission is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role permission link not found.",
            )
        self.role_repository.unlink_permission(role_permission)

    def assign_user_role(
        self,
        user_id: int,
        user_role_create: UserRoleCreate,
        current_user: User,
    ) -> UserRole:
        self._ensure_active_user(current_user)
        user = self.role_repository.get_user(user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        role = self.role_repository.get_by_id(user_role_create.role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        if self.role_repository.get_user_role(user.id, role.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role is already assigned to this user.",
            )
        user_role = self.role_repository.assign_user_role(user.id, role.id)
        NotificationService(self.db).create_notification(
            user_id=user.id,
            type="role.assigned",
            title="Role assigned",
            message=f"You were assigned the role '{role.name}'.",
            organization_id=role.organization_id,
            entity_type="role",
            entity_id=str(role.id),
        )
        return user_role

    def list_user_roles(self, user_id: int, current_user: User) -> list[UserRole]:
        self._ensure_active_user(current_user)
        user = self.role_repository.get_user(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return self.role_repository.list_user_roles(user.id)

    def remove_user_role(self, user_id: int, role_id: int, current_user: User) -> None:
        self._ensure_active_user(current_user)
        user = self.role_repository.get_user(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        user_role = self.role_repository.get_user_role(user.id, role_id)
        if user_role is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User role not found.")
        self.role_repository.remove_user_role(user_role)

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _validate_scope(self, scope: str) -> str:
        normalized_scope = scope.strip().lower()
        if normalized_scope not in VALID_ROLE_SCOPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Role scope must be one of: global, platform, organization, workspace, project, team, functional.",
            )
        return normalized_scope

    def _keyify(self, value: str) -> str:
        key = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        return key or "role"

    def ensure_role_catalog(self) -> None:
        changed = False
        for name, key, scope, description in ASTHRA_ROLE_CATALOG:
            existing = self.role_repository.get_by_scope_and_name(scope, name)
            if existing is not None:
                if not existing.is_system or existing.is_editable or existing.key != key:
                    existing.key = key
                    existing.is_system = True
                    existing.is_editable = False
                    if not existing.description:
                        existing.description = f"{description} Permission preset placeholder: {key}."
                    changed = True
                continue
            self.role_repository.create(
                name=name,
                key=key,
                description=f"{description} Permission preset placeholder: {key}.",
                scope=scope,
                organization_id=None,
                is_system=True,
                is_editable=False,
            )
            changed = True
        if changed:
            self.db.commit()
