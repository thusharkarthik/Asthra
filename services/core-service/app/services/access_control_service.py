from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import OrganizationMember
from app.models.permission import Permission
from app.models.project import Project
from app.models.role import Role, RolePermission
from app.models.user import User, UserRole
from app.models.workspace import Workspace, WorkspaceMember
from app.services.role_service import RoleService


LEGACY_ORGANIZATION_ROLE_MAP = {
    "owner": "organization_owner",
    "organization_owner": "organization_owner",
    "admin": "organization_admin",
    "organization_admin": "organization_admin",
    "auditor": "organization_auditor",
    "organization_auditor": "organization_auditor",
}

LEGACY_WORKSPACE_ROLE_MAP = {
    "owner": "workspace_admin",
    "admin": "workspace_admin",
    "workspace_admin": "workspace_admin",
    "manager": "workspace_manager",
    "workspace_manager": "workspace_manager",
    "member": "workspace_member",
    "workspace_member": "workspace_member",
    "viewer": "workspace_viewer",
    "workspace_viewer": "workspace_viewer",
}


@dataclass(frozen=True)
class ResolvedRole:
    id: int
    name: str
    key: str
    scope: str
    source_scope_type: str
    source_scope_id: int | None


class AccessControlService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_permissions(
        self,
        user_id: int,
        scope_type: str | None = None,
        scope_id: int | None = None,
    ) -> dict:
        user = self.db.get(User, user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        RoleService(self.db).ensure_role_catalog()
        scope_type, scope_id = self._normalize_scope(scope_type, scope_id)

        if user.is_superuser:
            permissions = self._all_permission_codes()
            return {
                "permission_codes": permissions,
                "roles": [
                    {
                        "id": 0,
                        "name": "Superuser",
                        "key": "superuser",
                        "scope": "platform",
                        "source_scope_type": "platform",
                        "source_scope_id": None,
                    }
                ],
                "scope": {"scope_type": scope_type, "scope_id": scope_id},
            }

        roles = self._resolve_roles(user_id, scope_type, scope_id)
        permission_codes = self._permission_codes_for_roles([role.id for role in roles])
        return {
            "permission_codes": sorted(permission_codes),
            "roles": [
                {
                    "id": role.id,
                    "name": role.name,
                    "key": role.key,
                    "scope": role.scope,
                    "source_scope_type": role.source_scope_type,
                    "source_scope_id": role.source_scope_id,
                }
                for role in roles
            ],
            "scope": {"scope_type": scope_type, "scope_id": scope_id},
        }

    def can(
        self,
        user_id: int,
        permission_code: str,
        scope_type: str | None = None,
        scope_id: int | None = None,
    ) -> bool:
        resolved = self.get_user_permissions(user_id, scope_type, scope_id)
        return permission_code in set(resolved["permission_codes"])

    def require(
        self,
        user: User,
        permission_code: str,
        scope_type: str | None = None,
        scope_id: int | None = None,
    ) -> None:
        if self.can(user.id, permission_code, scope_type, scope_id):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required: {permission_code}",
        )

    def _normalize_scope(self, scope_type: str | None, scope_id: int | None) -> tuple[str, int | None]:
        normalized = (scope_type or "platform").strip().lower()
        if normalized not in {"platform", "organization", "workspace", "project"}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported permission scope.")
        if normalized != "platform" and scope_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="scope_id is required for scoped permissions.")
        return normalized, scope_id

    def _resolve_roles(self, user_id: int, scope_type: str, scope_id: int | None) -> list[ResolvedRole]:
        roles: dict[tuple[int, str, int | None], ResolvedRole] = {}

        for user_role in self.db.query(UserRole).filter(UserRole.user_id == user_id).all():
            role = user_role.role
            if role and role.is_active:
                self._add_role(roles, role, "platform", None)

        if scope_type == "organization" and scope_id is not None:
            self._add_organization_membership_role(roles, user_id, scope_id)

        if scope_type == "workspace" and scope_id is not None:
            workspace = self._get_workspace(scope_id)
            self._add_organization_membership_role(roles, user_id, workspace.organization_id)
            self._add_workspace_membership_role(roles, user_id, workspace.id)

        if scope_type == "project" and scope_id is not None:
            project = self._get_project(scope_id)
            workspace = project.workspace
            self._add_organization_membership_role(roles, user_id, workspace.organization_id)
            self._add_workspace_membership_role(roles, user_id, workspace.id)

        return sorted(roles.values(), key=lambda role: (role.source_scope_type, role.scope, role.name))

    def _add_organization_membership_role(
        self,
        roles: dict[tuple[int, str, int | None], ResolvedRole],
        user_id: int,
        organization_id: int,
    ) -> None:
        member = (
            self.db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user_id,
            )
            .first()
        )
        if member is None:
            return
        role = member.role or self._role_by_key(LEGACY_ORGANIZATION_ROLE_MAP.get(member.member_role.lower()))
        if role and role.is_active:
            self._add_role(roles, role, "organization", organization_id)

    def _add_workspace_membership_role(
        self,
        roles: dict[tuple[int, str, int | None], ResolvedRole],
        user_id: int,
        workspace_id: int,
    ) -> None:
        member = (
            self.db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
            .first()
        )
        if member is None:
            return
        role = member.role or self._role_by_key(LEGACY_WORKSPACE_ROLE_MAP.get(member.member_role.lower()))
        if role and role.is_active:
            self._add_role(roles, role, "workspace", workspace_id)

    def _add_role(
        self,
        roles: dict[tuple[int, str, int | None], ResolvedRole],
        role: Role,
        source_scope_type: str,
        source_scope_id: int | None,
    ) -> None:
        roles[(role.id, source_scope_type, source_scope_id)] = ResolvedRole(
            id=role.id,
            name=role.name,
            key=role.key,
            scope=role.scope,
            source_scope_type=source_scope_type,
            source_scope_id=source_scope_id,
        )

    def _permission_codes_for_roles(self, role_ids: list[int]) -> set[str]:
        if not role_ids:
            return set()
        rows = (
            self.db.query(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .filter(
                Role.id.in_(role_ids),
                Role.is_active.is_(True),
                Permission.is_active.is_(True),
                Permission.status == "active",
            )
            .all()
        )
        return {row[0] for row in rows}

    def _all_permission_codes(self) -> list[str]:
        rows = (
            self.db.query(Permission.code)
            .filter(Permission.is_active.is_(True), Permission.status == "active")
            .order_by(Permission.code)
            .all()
        )
        return [row[0] for row in rows]

    def _role_by_key(self, key: str | None) -> Role | None:
        if key is None:
            return None
        return (
            self.db.query(Role)
            .filter(Role.key == key, Role.is_active.is_(True))
            .first()
        )

    def _get_workspace(self, workspace_id: int) -> Workspace:
        workspace = self.db.get(Workspace, workspace_id)
        if workspace is None or not workspace.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
        return workspace

    def _get_project(self, project_id: int) -> Project:
        project = self.db.get(Project, project_id)
        if project is None or not project.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return project
