from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import Organization, OrganizationMember
from app.models.permission import Permission
from app.models.project import Project, ProjectMembership
from app.models.role import Role, RolePermission
from app.models.team import Team, TeamMember
from app.models.user import RoleAssignment, User, UserRole
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
            roles = self._resolve_roles(user_id, scope_type, scope_id)
            role_payload = [
                {
                    "id": role.id,
                    "name": role.name,
                    "key": role.key,
                    "scope": role.scope,
                    "source_scope_type": role.source_scope_type,
                    "source_scope_id": role.source_scope_id,
                }
                for role in roles
            ]
            if not any(role["key"] == "superuser" for role in role_payload):
                role_payload.insert(
                    0,
                    {
                        "id": 0,
                        "name": "Superuser",
                        "key": "superuser",
                        "scope": "platform",
                        "source_scope_type": "platform",
                        "source_scope_id": None,
                    },
                )
            return {
                "permission_codes": permissions,
                "roles": role_payload,
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
        user = self.db.get(User, user_id)
        if user is not None and user.is_active and user.is_superuser:
            return True
        resolved = self.get_user_permissions(user_id, scope_type, scope_id)
        return permission_code in set(resolved["permission_codes"])

    def has_permission(
        self,
        user_id: int,
        permission_code: str,
        scope_type: str | None = None,
        scope_id: int | None = None,
    ) -> bool:
        return self.can(user_id, permission_code, scope_type, scope_id)

    def can_access_scope(self, user_id: int, scope_type: str | None = None, scope_id: int | None = None) -> bool:
        try:
            resolved = self.get_user_permissions(user_id, scope_type, scope_id)
        except HTTPException:
            return False
        return bool(resolved["roles"] or resolved["permission_codes"])

    def get_effective_roles(self, user_id: int, scope_type: str | None = None, scope_id: int | None = None) -> list[dict]:
        return self.get_user_permissions(user_id, scope_type, scope_id)["roles"]

    def get_effective_permissions(self, user_id: int, scope_type: str | None = None, scope_id: int | None = None) -> list[str]:
        return self.get_user_permissions(user_id, scope_type, scope_id)["permission_codes"]

    def debug_effective_access(
        self,
        user_id: int,
        scope_type: str | None = None,
        scope_id: int | None = None,
        action_keys: list[str] | None = None,
    ) -> dict:
        user = self.db.get(User, user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        scope_type, scope_id = self._normalize_scope(scope_type, scope_id)
        resolved = self.get_user_permissions(user_id, scope_type, scope_id)
        roles = resolved["roles"]
        direct_roles = [
            role for role in roles
            if role["source_scope_type"] == scope_type and role["source_scope_id"] == scope_id
        ]
        inherited_roles = [role for role in roles if role not in direct_roles]
        permission_sources = self._permission_source_trace(roles, user.is_superuser, scope_type, scope_id)
        permission_codes = sorted(resolved["permission_codes"])
        action_results = []
        for action_key in action_keys or []:
            permission_code = action_key.strip()
            if not permission_code:
                continue
            sources = permission_sources.get(permission_code, [])
            action_results.append({
                "action_key": action_key,
                "action_label": permission_code.replace(".", " ").replace("_", " ").title(),
                "permission_code": permission_code,
                "allowed": permission_code in permission_codes,
                "source_role": sources[0]["role_name"] if sources else None,
                "scope_source": sources[0]["scope_label"] if sources else None,
                "sources": sources,
            })

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
            },
            "scope": {"scope_type": scope_type, "scope_id": scope_id},
            "direct_roles": direct_roles,
            "inherited_roles": inherited_roles,
            "effective_permissions": permission_codes,
            "permission_trace": [
                {"permission_code": code, "sources": permission_sources.get(code, [])}
                for code in permission_codes
            ],
            "action_results": action_results,
        }

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

    def guard_superuser_self_removal(self, target_user_id: int, current_user: User) -> None:
        """Block a superuser from removing their own roles — another superuser must perform this action."""
        if current_user.is_superuser and current_user.id == target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Superusers cannot remove their own roles. Ask another superuser.",
            )

    def _normalize_scope(self, scope_type: str | None, scope_id: int | None) -> tuple[str, int | None]:
        normalized = (scope_type or "platform").strip().lower()
        if normalized not in {"platform", "organization", "workspace", "project", "team"}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported permission scope.")
        if normalized != "platform" and scope_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="scope_id is required for scoped permissions.")
        return normalized, scope_id

    def _resolve_roles(self, user_id: int, scope_type: str, scope_id: int | None) -> list[ResolvedRole]:
        roles: dict[tuple[int, str, int | None], ResolvedRole] = {}

        for user_role in self.db.query(UserRole).filter(UserRole.user_id == user_id).all():
            role = user_role.role
            if role and role.is_active and role.scope == "platform":
                self._add_role(roles, role, "platform", None)
        self._add_role_assignments(roles, user_id, scope_type, scope_id)

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
            self._add_project_membership_role(roles, user_id, project.id)

        if scope_type == "team" and scope_id is not None:
            team = self._get_team(scope_id)
            self._add_organization_membership_role(roles, user_id, team.workspace.organization_id)
            self._add_workspace_membership_role(roles, user_id, team.workspace_id)
            self._add_team_membership_role(roles, user_id, team.id)

        return sorted(roles.values(), key=lambda role: (role.source_scope_type, role.scope, role.name))

    def _add_role_assignments(
        self,
        roles: dict[tuple[int, str, int | None], ResolvedRole],
        user_id: int,
        scope_type: str,
        scope_id: int | None,
    ) -> None:
        assignments = self.db.query(RoleAssignment).filter(RoleAssignment.user_id == user_id, RoleAssignment.status == "active").all()
        for assignment in assignments:
            if assignment.role and assignment.role.is_active and self._assignment_applies(assignment, scope_type, scope_id):
                self._add_role(roles, assignment.role, assignment.scope_type, assignment.scope_id)

    def _assignment_applies(self, assignment: RoleAssignment, scope_type: str, scope_id: int | None) -> bool:
        if assignment.scope_type == "platform":
            return True
        if assignment.scope_type == scope_type and assignment.scope_id == scope_id:
            return True
        if scope_type == "workspace" and assignment.scope_type == "organization" and scope_id is not None:
            return assignment.scope_id == self._get_workspace(scope_id).organization_id
        if scope_type == "project" and scope_id is not None:
            project = self._get_project(scope_id)
            if assignment.scope_type == "organization":
                return assignment.scope_id == project.workspace.organization_id
            if assignment.scope_type == "workspace":
                return assignment.scope_id == project.workspace_id
        if scope_type == "team" and scope_id is not None:
            team = self._get_team(scope_id)
            if assignment.scope_type == "organization":
                return assignment.scope_id == team.workspace.organization_id
            if assignment.scope_type == "workspace":
                return assignment.scope_id == team.workspace_id
        return False

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

    def _add_project_membership_role(
        self,
        roles: dict[tuple[int, str, int | None], ResolvedRole],
        user_id: int,
        project_id: int,
    ) -> None:
        member = (
            self.db.query(ProjectMembership)
            .filter(ProjectMembership.project_id == project_id, ProjectMembership.user_id == user_id, ProjectMembership.status == "active")
            .first()
        )
        if member and member.role and member.role.is_active:
            self._add_role(roles, member.role, "project", project_id)

    def _add_team_membership_role(
        self,
        roles: dict[tuple[int, str, int | None], ResolvedRole],
        user_id: int,
        team_id: int,
    ) -> None:
        member = (
            self.db.query(TeamMember)
            .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id, TeamMember.status == "active")
            .first()
        )
        if member and member.role and member.role.is_active:
            self._add_role(roles, member.role, "team", team_id)

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

    def _permission_source_trace(
        self,
        resolved_roles: list[dict],
        is_superuser: bool,
        target_scope_type: str,
        target_scope_id: int | None,
    ) -> dict[str, list[dict]]:
        if is_superuser:
            return {
                code: [{
                    "role_name": "Superuser",
                    "role_key": "superuser",
                    "role_scope": "platform",
                    "source_scope_type": "platform",
                    "source_scope_id": None,
                    "scope_label": "Platform",
                    "inherited_through": self._scope_path("platform", None, target_scope_type, target_scope_id),
                }]
                for code in self._all_permission_codes()
            }
        role_ids = [role["id"] for role in resolved_roles]
        if not role_ids:
            return {}
        role_by_id = {role["id"]: role for role in resolved_roles}
        rows = (
            self.db.query(Permission.code, Role.id)
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
        trace: dict[str, list[dict]] = {}
        for permission_code, role_id in rows:
            role = role_by_id.get(role_id)
            if role is None:
                continue
            trace.setdefault(permission_code, []).append({
                "role_name": role["name"],
                "role_key": role["key"],
                "role_scope": role["scope"],
                "source_scope_type": role["source_scope_type"],
                "source_scope_id": role["source_scope_id"],
                "scope_label": self._scope_label(role["source_scope_type"], role["source_scope_id"]),
                "inherited_through": self._scope_path(role["source_scope_type"], role["source_scope_id"], target_scope_type, target_scope_id),
            })
        return trace

    def _all_permission_codes(self) -> list[str]:
        rows = (
            self.db.query(Permission.code)
            .filter(Permission.is_active.is_(True), Permission.status == "active")
            .order_by(Permission.code)
            .all()
        )
        return [row[0] for row in rows]

    def _scope_label(self, scope_type: str, scope_id: int | None) -> str:
        if scope_type == "platform" or scope_id is None:
            return "Platform"
        if scope_type == "organization":
            organization = self.db.get(Organization, scope_id)
            return organization.name if organization else f"Organization {scope_id}"
        if scope_type == "workspace":
            workspace = self.db.get(Workspace, scope_id)
            return workspace.name if workspace else f"Workspace {scope_id}"
        if scope_type == "project":
            project = self.db.get(Project, scope_id)
            return project.name if project else f"Project {scope_id}"
        if scope_type == "team":
            team = self.db.get(Team, scope_id)
            return team.name if team else f"Team {scope_id}"
        return f"{scope_type.title()} {scope_id}"

    def _scope_path(
        self,
        source_scope_type: str,
        source_scope_id: int | None,
        target_scope_type: str,
        target_scope_id: int | None,
    ) -> list[str]:
        if source_scope_type == target_scope_type and source_scope_id == target_scope_id:
            return [source_scope_type.title()]
        order = ["platform", "organization", "workspace", "project", "team"]
        try:
            source_index = order.index(source_scope_type)
            target_index = order.index(target_scope_type)
        except ValueError:
            return [source_scope_type.title(), target_scope_type.title()]
        if source_index <= target_index:
            return [item.title() for item in order[source_index:target_index + 1]]
        return [source_scope_type.title(), target_scope_type.title()]

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
        if workspace is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
        return workspace

    def _get_project(self, project_id: int) -> Project:
        project = self.db.get(Project, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return project

    def _get_team(self, team_id: int) -> Team:
        team = self.db.get(Team, team_id)
        if team is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")
        return team
