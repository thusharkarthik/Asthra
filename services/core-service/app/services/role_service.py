from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.role import Role, RolePermission
from app.models.user import RoleAssignment, User, UserRole
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.role import RoleCreate, RolePermissionCreate, RolePermissionsReplace, RoleUpdate, UserRoleCreate
from app.services.activity_service import ActivityService
from app.services.context_version_service import ContextVersionService
from app.services.notification_service import NotificationService


VALID_ROLE_SCOPES = {"global", "platform", "organization", "workspace", "project", "team", "functional"}

ASTHRA_ROLE_TEMPLATES = [
    {
        "name": "Superuser",
        "key": "superuser",
        "scope": "platform",
        "description": "Hidden emergency platform recovery role with full permission bypass.",
        "permission_patterns": ["*"],
        "is_hidden": True,
    },
    {
        "name": "Platform Owner",
        "key": "platform_owner",
        "scope": "platform",
        "description": "Full platform administration and future billing ownership.",
        "permission_patterns": ["*"],
        "is_hidden": False,
    },
    {
        "name": "Platform Admin",
        "key": "platform_admin",
        "scope": "platform",
        "description": "Platform administration without owner-only protections.",
        "permission_patterns": ["settings.*", "flow.*", "docs.*", "discover.*", "desk.*", "pulse.*", "dev.*", "automation.*", "guard.*", "insights.*", "media.*"],
    },
    {
        "name": "Platform Support",
        "key": "platform_support",
        "scope": "platform",
        "description": "Support operational access for platform assistance.",
        "permission_patterns": ["*.view", "desk.ticket.manage", "pulse.incident.view"],
    },
    {
        "name": "Organization Owner",
        "key": "organization_owner",
        "scope": "organization",
        "description": "Full organization administration and last-owner protected access.",
        "permission_patterns": ["settings.organization.*", "settings.workspace.*", "settings.project.*", "settings.member.*", "settings.role.*", "settings.permission.*", "settings.team.*", "guard.audit.view", "insights.report.view"],
    },
    {
        "name": "Organization Admin",
        "key": "organization_admin",
        "scope": "organization",
        "description": "Manage organization settings, workspaces, and members.",
        "permission_patterns": ["settings.organization.view", "settings.organization.manage", "settings.workspace.*", "settings.project.*", "settings.member.*", "settings.role.view", "settings.permission.view", "settings.team.*", "guard.audit.view", "insights.report.view"],
    },
    {
        "name": "Organization Auditor",
        "key": "organization_auditor",
        "scope": "organization",
        "description": "Read organization settings and audit data.",
        "permission_patterns": ["*.view", "guard.audit.view", "insights.report.view"],
    },
    {
        "name": "Workspace Admin",
        "key": "workspace_admin",
        "scope": "workspace",
        "description": "Manage workspace settings, projects, teams, and members.",
        "permission_patterns": ["settings.workspace.*", "settings.project.*", "settings.member.*", "settings.team.*", "flow.*", "docs.*", "discover.*", "desk.ticket.view", "pulse.incident.view", "insights.report.view", "media.asset.view"],
    },
    {
        "name": "Workspace Manager",
        "key": "workspace_manager",
        "scope": "workspace",
        "description": "Manage workspace execution and project delivery.",
        "permission_patterns": ["settings.workspace.view", "settings.project.view", "settings.member.view", "settings.member.invite", "settings.team.view", "flow.*", "docs.space.view", "docs.page.*", "discover.idea.*", "desk.ticket.view", "pulse.incident.view", "insights.report.view"],
    },
    {
        "name": "Workspace Member",
        "key": "workspace_member",
        "scope": "workspace",
        "description": "Create and edit workspace/project work.",
        "permission_patterns": ["settings.workspace.view", "settings.project.view", "settings.member.view", "flow.work_item.view", "flow.work_item.create", "flow.work_item.edit", "flow.board.view", "flow.sprint.view", "flow.release.view", "docs.space.view", "docs.page.view", "docs.page.create", "docs.page.edit", "discover.idea.view", "desk.ticket.view", "pulse.incident.view", "media.asset.view"],
    },
    {
        "name": "Workspace Viewer",
        "key": "workspace_viewer",
        "scope": "workspace",
        "description": "Read-only workspace access.",
        "permission_patterns": ["*.view"],
    },
    {
        "name": "Project Admin",
        "key": "project_admin",
        "scope": "project",
        "description": "Manage project settings, members, and work.",
        "permission_patterns": ["settings.project.*", "settings.member.view", "flow.*", "docs.page.view", "discover.idea.view", "desk.ticket.view", "pulse.incident.view", "dev.release.view"],
    },
    {
        "name": "Project Manager",
        "key": "project_manager",
        "scope": "project",
        "description": "Manage project plans, sprints, releases, reports, and delivery.",
        "permission_patterns": ["flow.work_item.*", "flow.board.view", "flow.sprint.*", "flow.release.*", "flow.workflow.view", "flow.report.view", "docs.page.view"],
    },
    {
        "name": "Project Contributor",
        "key": "project_contributor",
        "scope": "project",
        "description": "Contribute work and comments in a project.",
        "permission_patterns": ["flow.work_item.view", "flow.work_item.create", "flow.work_item.edit", "flow.work_item.assign", "flow.board.view", "flow.sprint.view", "flow.release.view", "docs.page.view"],
    },
    {
        "name": "Project Viewer",
        "key": "project_viewer",
        "scope": "project",
        "description": "Read-only project access.",
        "permission_patterns": ["settings.project.view", "flow.work_item.view", "flow.board.view", "flow.sprint.view", "flow.release.view", "flow.workflow.view", "flow.report.view", "docs.page.view"],
    },
    {
        "name": "Team Lead",
        "key": "team_lead",
        "scope": "team",
        "description": "Manage team members and team-owned work.",
        "permission_patterns": ["settings.team.*", "flow.work_item.*", "flow.board.view", "flow.sprint.view", "flow.release.view", "flow.report.view", "docs.page.view"],
    },
    {
        "name": "Team Member",
        "key": "team_member",
        "scope": "team",
        "description": "Participate in team-owned work.",
        "permission_patterns": ["settings.team.view", "flow.work_item.view", "flow.work_item.create", "flow.work_item.edit", "flow.board.view", "flow.sprint.view", "flow.release.view", "docs.page.view"],
    },
    {
        "name": "Team Observer",
        "key": "team_observer",
        "scope": "team",
        "description": "Read team activity and work.",
        "permission_patterns": ["settings.team.view", "flow.work_item.view", "flow.board.view", "flow.sprint.view", "flow.release.view", "flow.report.view"],
    },
    {
        "name": "Product Owner",
        "key": "product_owner",
        "scope": "functional",
        "description": "Own product priorities and acceptance decisions.",
        "permission_patterns": ["flow.work_item.*", "flow.board.view", "flow.sprint.view", "flow.release.view", "flow.report.view", "docs.page.*", "discover.idea.*"],
    },
    {
        "name": "Scrum Master",
        "key": "scrum_master",
        "scope": "functional",
        "description": "Facilitate sprint execution and team ceremonies.",
        "permission_patterns": ["flow.work_item.view", "flow.work_item.edit", "flow.work_item.assign", "flow.board.view", "flow.sprint.*", "flow.report.view"],
    },
    {
        "name": "Engineering Manager",
        "key": "engineering_manager",
        "scope": "functional",
        "description": "Manage engineering team delivery and ownership.",
        "permission_patterns": ["flow.*", "docs.page.view", "desk.ticket.view", "pulse.incident.view", "dev.release.*", "insights.report.view"],
    },
    {
        "name": "Release Manager",
        "key": "release_manager",
        "scope": "functional",
        "description": "Coordinate release planning and rollout readiness.",
        "permission_patterns": ["flow.work_item.view", "flow.board.view", "flow.release.*", "flow.report.view", "dev.release.*"],
    },
    {
        "name": "Incident Commander",
        "key": "incident_commander",
        "scope": "functional",
        "description": "Coordinate incident response and communications.",
        "permission_patterns": ["desk.ticket.*", "pulse.incident.*", "flow.work_item.view", "flow.work_item.create", "docs.page.view"],
    },
    {
        "name": "Knowledge Manager",
        "key": "knowledge_manager",
        "scope": "functional",
        "description": "Manage knowledge quality and documentation practices.",
        "permission_patterns": ["docs.page.*", "settings.workspace.view"],
    },
]

ASTHRA_ROLE_CATALOG = [
    (template["name"], template["key"], template["scope"], template["description"])
    for template in ASTHRA_ROLE_TEMPLATES
]


class RoleService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.role_repository = RoleRepository(db)
        self.permission_repository = PermissionRepository(db)

    def create(self, role_create: RoleCreate, current_user: User) -> Role:
        self._ensure_active_user(current_user)
        self._require_role_manage(current_user, "organization" if role_create.organization_id else "platform", role_create.organization_id)
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
            is_hidden=role_create.is_hidden,
        )
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=role.organization_id,
            entity_type="role",
            entity_id=str(role.id),
            action="role.created",
            description=f"Role '{role.name}' was created.",
        )
        ContextVersionService(self.db).bump_access("organization" if role.organization_id else "platform", role.organization_id)
        self.db.commit()
        return role

    def list(self, current_user: User) -> list[Role]:
        self._ensure_active_user(current_user)
        self.ensure_role_catalog()
        roles = self.role_repository.list()
        if self._can_view_hidden_roles(current_user):
            return roles
        return [role for role in roles if not role.is_hidden]

    def list_templates(self, current_user: User) -> list[dict]:
        self._ensure_active_user(current_user)
        self.ensure_role_catalog()
        return [
            {
                "name": template["name"],
                "key": template["key"],
                "scope": template["scope"],
                "description": template["description"],
                "permission_patterns": template["permission_patterns"],
                "is_system": True,
                "is_editable": False,
                "is_hidden": bool(template.get("is_hidden", False)),
            }
            for template in ASTHRA_ROLE_TEMPLATES
            if not template.get("is_hidden") or self._can_view_hidden_roles(current_user)
        ]

    def get(self, role_id: int, current_user: User) -> Role:
        self._ensure_active_user(current_user)
        role = self.role_repository.get_by_id(role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        if role.is_hidden and not self._can_view_hidden_roles(current_user):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        return role

    def update(self, role_id: int, role_update: RoleUpdate, current_user: User) -> Role:
        role = self.get(role_id, current_user)
        self._require_role_manage(current_user, "organization" if role.organization_id else "platform", role.organization_id)
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
        role = self.role_repository.update(role, role_update)
        ContextVersionService(self.db).bump_access("organization" if role.organization_id else "platform", role.organization_id)
        self.db.commit()
        self.db.refresh(role)
        return role

    def delete(self, role_id: int, current_user: User) -> None:
        role = self.get(role_id, current_user)
        self._require_role_manage(current_user, "organization" if role.organization_id else "platform", role.organization_id)
        if not role.is_editable:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System role is not editable.")
        self.role_repository.update(role, RoleUpdate(is_active=False))
        ContextVersionService(self.db).bump_access("organization" if role.organization_id else "platform", role.organization_id)
        self.db.commit()

    def link_permission(
        self,
        role_id: int,
        link_create: RolePermissionCreate,
        current_user: User,
    ) -> RolePermission:
        role = self.get(role_id, current_user)
        self._require_role_manage(current_user, "organization" if role.organization_id else "platform", role.organization_id)
        if not role.is_editable:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System role is not editable.")
        permission = self.permission_repository.get_by_id(link_create.permission_id)
        if permission is None or not permission.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
        if self.role_repository.get_role_permission(role.id, permission.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Permission is already linked to this role.",
            )
        role_permission = self.role_repository.link_permission(role.id, permission.id)
        ContextVersionService(self.db).bump_access("organization" if role.organization_id else "platform", role.organization_id)
        self.db.commit()
        self.db.refresh(role_permission)
        return role_permission

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
        self._require_role_manage(current_user, "organization" if role.organization_id else "platform", role.organization_id)
        if not role.is_editable:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System role is not editable.")
        permission_ids = list(dict.fromkeys(replace_create.permission_ids))
        for permission_id in permission_ids:
            permission = self.permission_repository.get_by_id(permission_id)
            if permission is None or not permission.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Permission {permission_id} not found.")
        role_permissions = self.role_repository.replace_permissions(role.id, permission_ids)
        ContextVersionService(self.db).bump_access("organization" if role.organization_id else "platform", role.organization_id)
        self.db.commit()
        return role_permissions

    def unlink_permission(self, role_id: int, permission_id: int, current_user: User) -> None:
        role = self.get(role_id, current_user)
        self._require_role_manage(current_user, "organization" if role.organization_id else "platform", role.organization_id)
        if not role.is_editable:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System role is not editable.")
        role_permission = self.role_repository.get_role_permission(role.id, permission_id)
        if role_permission is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role permission link not found.",
            )
        self.role_repository.unlink_permission(role_permission)
        ContextVersionService(self.db).bump_access("organization" if role.organization_id else "platform", role.organization_id)
        self.db.commit()

    def assign_user_role(
        self,
        user_id: int,
        user_role_create: UserRoleCreate,
        current_user: User,
    ) -> UserRole:
        self._ensure_active_user(current_user)
        self._require_role_manage(current_user, "platform", None)
        user = self.role_repository.get_user(user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        role = self.role_repository.get_by_id(user_role_create.role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        self._ensure_role_can_be_assigned(role, current_user, "platform", None)
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
        ContextVersionService(self.db).bump_access("platform", None)
        self.db.commit()
        return user_role

    def list_user_roles(self, user_id: int, current_user: User) -> list[UserRole]:
        self._ensure_active_user(current_user)
        user = self.role_repository.get_user(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return self.role_repository.list_user_roles(user.id)

    def remove_user_role(self, user_id: int, role_id: int, current_user: User) -> None:
        self._ensure_active_user(current_user)
        self._require_role_manage(current_user, "platform", None)
        user = self.role_repository.get_user(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        user_role = self.role_repository.get_user_role(user.id, role_id)
        if user_role is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User role not found.")
        self._ensure_not_last_protected_role(user, user_role.role)
        self.role_repository.remove_user_role(user_role)
        ContextVersionService(self.db).bump_access("platform", None)
        self.db.commit()

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _require_role_manage(self, user: User, scope_type: str, scope_id: int | None) -> None:
        from app.services.access_control_service import AccessControlService

        AccessControlService(self.db).require(
            user,
            "settings.role.manage",
            scope_type,
            scope_id,
        )

    def _can_view_hidden_roles(self, user: User) -> bool:
        if user.is_superuser:
            return True
        platform_owner = (
            self.db.query(Role)
            .filter(Role.key == "platform_owner", Role.scope == "platform", Role.is_active.is_(True))
            .first()
        )
        if platform_owner is None:
            return False
        user_role_exists = (
            self.db.query(UserRole.id)
            .filter(UserRole.user_id == user.id, UserRole.role_id == platform_owner.id)
            .first()
            is not None
        )
        if user_role_exists:
            return True
        return (
            self.db.query(RoleAssignment.id)
            .filter(
                RoleAssignment.user_id == user.id,
                RoleAssignment.role_id == platform_owner.id,
                RoleAssignment.scope_type == "platform",
                RoleAssignment.status == "active",
            )
            .first()
            is not None
        )

    def _ensure_role_can_be_assigned(self, role: Role, current_user: User, scope_type: str, scope_id: int | None) -> None:
        if role.scope == "platform" and scope_type != "platform":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Platform roles can only be assigned at platform scope.")
        if role.is_hidden and not self._can_view_hidden_roles(current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot assign this role.")

    def _ensure_not_last_protected_role(self, user: User, role: Role | None) -> None:
        if role is None or role.key not in {"superuser", "platform_owner"}:
            return
        protected_user_ids = {
            row[0]
            for row in self.db.query(UserRole.user_id)
            .join(Role, Role.id == UserRole.role_id)
            .join(User, User.id == UserRole.user_id)
            .filter(Role.key == role.key, Role.scope == "platform", User.is_active.is_(True))
            .all()
        }
        protected_user_ids.update(
            row[0]
            for row in self.db.query(RoleAssignment.user_id)
            .join(Role, Role.id == RoleAssignment.role_id)
            .join(User, User.id == RoleAssignment.user_id)
            .filter(
                Role.key == role.key,
                Role.scope == "platform",
                RoleAssignment.status == "active",
                User.is_active.is_(True),
            )
            .all()
        )
        if role.key == "superuser":
            protected_user_ids.update(
                row[0]
                for row in self.db.query(User.id).filter(User.is_superuser.is_(True), User.is_active.is_(True)).all()
            )
        if len(protected_user_ids) <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot remove the last {role.name}.")

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

    def ensure_role_catalog(self, *, sync_permissions: bool = True) -> None:
        from app.services.permission_service import PermissionService

        if sync_permissions:
            PermissionService(self.db).ensure_permission_catalog()
        changed = False
        role_by_key: dict[str, Role] = {}
        for template in ASTHRA_ROLE_TEMPLATES:
            name = template["name"]
            key = template["key"]
            scope = template["scope"]
            description = template["description"]
            is_hidden = bool(template.get("is_hidden", False))
            existing = self.role_repository.get_by_scope_and_name(scope, name)
            if existing is not None:
                if (
                    not existing.is_system
                    or existing.is_editable
                    or existing.key != key
                    or existing.description != description
                    or existing.is_hidden != is_hidden
                ):
                    existing.key = key
                    existing.is_system = True
                    existing.is_editable = False
                    existing.description = description
                    existing.is_hidden = is_hidden
                    changed = True
                role_by_key[key] = existing
                continue
            role = Role(
                name=name,
                key=key,
                description=description,
                scope=scope,
                organization_id=None,
                is_system=True,
                is_editable=False,
                is_hidden=is_hidden,
            )
            self.db.add(role)
            role_by_key[key] = role
            changed = True
        if changed:
            self.db.commit()
        self._sync_role_template_permissions(role_by_key)

    def _sync_role_template_permissions(self, role_by_key: dict[str, Role]) -> None:
        permissions = self.permission_repository.list()
        permission_ids_by_code = {permission.code: permission.id for permission in permissions}
        permission_codes = sorted(permission_ids_by_code)
        role_ids = [role.id for role in role_by_key.values() if role is not None]
        existing_mappings = (
            self.db.query(RolePermission)
            .filter(RolePermission.role_id.in_(role_ids))
            .all()
            if role_ids
            else []
        )
        existing_by_role: dict[int, set[int]] = {}
        mappings_by_pair: dict[tuple[int, int], RolePermission] = {}
        for mapping in existing_mappings:
            existing_by_role.setdefault(mapping.role_id, set()).add(mapping.permission_id)
            mappings_by_pair[(mapping.role_id, mapping.permission_id)] = mapping

        dirty = False
        for template in ASTHRA_ROLE_TEMPLATES:
            role = role_by_key.get(template["key"])
            if role is None:
                continue
            wanted_permission_ids = {
                permission_ids_by_code[code]
                for code in permission_codes
                if self._permission_matches_template(code, template["permission_patterns"])
            }
            existing_permission_ids = existing_by_role.get(role.id, set())
            if existing_permission_ids == wanted_permission_ids:
                continue
            for permission_id in existing_permission_ids - wanted_permission_ids:
                mapping = mappings_by_pair.get((role.id, permission_id))
                if mapping is not None:
                    self.db.delete(mapping)
                    dirty = True
            for permission_id in wanted_permission_ids - existing_permission_ids:
                self.db.add(RolePermission(role_id=role.id, permission_id=permission_id))
                dirty = True
        if dirty:
            self.db.commit()

    def _permission_matches_template(self, permission_code: str, patterns: list[str]) -> bool:
        for pattern in patterns:
            if pattern == "*":
                return True
            if pattern.startswith("*.") and permission_code.endswith(pattern[1:]):
                return True
            if pattern.endswith(".*") and permission_code.startswith(pattern[:-1]):
                return True
            if permission_code == pattern:
                return True
        return False
