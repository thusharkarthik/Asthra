from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.organization import Organization, OrganizationMember
from app.models.project import Project, ProjectMembership
from app.models.role import Role
from app.models.team import Team, TeamMember
from app.models.user import RoleAssignment, User, UserRole
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.scoped_membership import (
    ProjectMembershipCreate,
    ProjectMembershipUpdate,
    RoleAssignmentCreate,
    RoleAssignmentUpdate,
)
from app.schemas.team import TeamMemberUpdate
from app.services.access_control_service import AccessControlService
from app.services.context_version_service import ContextVersionService


class ScopedMembershipService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_role_assignments(
        self,
        current_user: User,
        *,
        user_id: int | None = None,
        role_id: int | None = None,
        scope_type: str | None = None,
        scope_id: int | None = None,
        status_filter: str | None = None,
    ) -> list[RoleAssignment]:
        self._ensure_active_user(current_user)
        query = self.db.query(RoleAssignment)
        if user_id is not None:
            query = query.filter(RoleAssignment.user_id == user_id)
        if role_id is not None:
            query = query.filter(RoleAssignment.role_id == role_id)
        if scope_type is not None:
            query = query.filter(RoleAssignment.scope_type == scope_type)
        if scope_id is not None:
            query = query.filter(RoleAssignment.scope_id == scope_id)
        if status_filter is not None:
            query = query.filter(RoleAssignment.status == status_filter)
        assignments = query.order_by(RoleAssignment.created_at.desc()).all()
        if current_user.is_superuser:
            return assignments

        access = AccessControlService(self.db)

        def can_view_assignment(assignment: RoleAssignment) -> bool:
            if assignment.user_id == current_user.id:
                return True
            try:
                return access.can(current_user.id, "settings.role.view", assignment.scope_type, assignment.scope_id)
            except HTTPException:
                return False

        return [assignment for assignment in assignments if can_view_assignment(assignment)]

    def create_role_assignment(self, assignment_create: RoleAssignmentCreate, current_user: User) -> RoleAssignment:
        self._ensure_active_user(current_user)
        self._require_role_assignment_manage(current_user, assignment_create.scope_type, assignment_create.scope_id)
        target_user = self._get_active_user(assignment_create.user_id)
        role = self._get_active_role(assignment_create.role_id)
        self._ensure_scope_exists(assignment_create.scope_type, assignment_create.scope_id)
        self._ensure_role_can_be_assigned(role, current_user, assignment_create.scope_type)

        existing = (
            self.db.query(RoleAssignment)
            .filter(
                RoleAssignment.user_id == target_user.id,
                RoleAssignment.role_id == role.id,
                RoleAssignment.scope_type == assignment_create.scope_type,
                RoleAssignment.scope_id == assignment_create.scope_id,
            )
            .first()
        )
        if existing is not None and existing.status == "active":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role assignment already exists.")
        if existing is not None:
            existing.status = "active"
            existing.revoked_at = None
            existing.assigned_by = current_user.id
            existing.assigned_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(existing)
            assignment = existing
        else:
            assignment = RoleAssignment(
                user_id=target_user.id,
                role_id=role.id,
                scope_type=assignment_create.scope_type,
                scope_id=assignment_create.scope_id,
                status=assignment_create.status,
                assigned_by=current_user.id,
                assigned_at=datetime.now(timezone.utc),
            )
            self.db.add(assignment)
            self.db.commit()
            self.db.refresh(assignment)
        self._log("role.assigned", current_user.id, assignment.scope_type, assignment.scope_id, "role_assignment", assignment.id)
        ContextVersionService(self.db).bump_access(assignment.scope_type, assignment.scope_id)
        self._ensure_memberships_for_assignment(assignment, current_user.id)
        self.db.commit()
        return assignment

    def update_role_assignment(
        self,
        assignment_id: int,
        assignment_update: RoleAssignmentUpdate,
        current_user: User,
    ) -> RoleAssignment:
        assignment = self._get_assignment(assignment_id)
        self._require_role_assignment_manage(current_user, assignment.scope_type, assignment.scope_id)
        if assignment_update.role_id is not None:
            role = self._get_active_role(assignment_update.role_id)
            self._ensure_role_can_be_assigned(role, current_user, assignment.scope_type)
            self._ensure_not_last_protected_assignment(assignment)
            assignment.role_id = role.id
        if assignment_update.status is not None:
            if assignment_update.status != "active":
                self._ensure_not_last_protected_assignment(assignment)
            assignment.status = assignment_update.status
            assignment.revoked_at = datetime.now(timezone.utc) if assignment_update.status == "revoked" else None
        self.db.commit()
        self.db.refresh(assignment)
        self._log("role.changed", current_user.id, assignment.scope_type, assignment.scope_id, "role_assignment", assignment.id)
        ContextVersionService(self.db).bump_access(assignment.scope_type, assignment.scope_id)
        self.db.commit()
        return assignment

    def delete_role_assignment(self, assignment_id: int, current_user: User) -> None:
        assignment = self._get_assignment(assignment_id)
        self._require_role_assignment_manage(current_user, assignment.scope_type, assignment.scope_id)
        self._ensure_not_last_protected_assignment(assignment)
        assignment.status = "revoked"
        assignment.revoked_at = datetime.now(timezone.utc)
        self._cleanup_membership_after_last_role_removed(assignment)
        self.db.commit()
        self._log("role.revoked", current_user.id, assignment.scope_type, assignment.scope_id, "role_assignment", assignment.id)
        ContextVersionService(self.db).bump_access(assignment.scope_type, assignment.scope_id)
        self.db.commit()

    def list_project_members(self, project_id: int, current_user: User) -> list[ProjectMembership]:
        project = self._get_project(project_id)
        self._ensure_project_access(project, current_user)
        return (
            self.db.query(ProjectMembership)
            .filter(ProjectMembership.project_id == project.id)
            .order_by(ProjectMembership.created_at.asc())
            .all()
        )

    def add_project_member(
        self,
        project_id: int,
        member_create: ProjectMembershipCreate,
        current_user: User,
    ) -> ProjectMembership:
        project = self._get_project(project_id)
        self._require_scope_manage(current_user, "project", project.id)
        target_user = self._get_active_user(member_create.user_id)
        if not self._is_workspace_member(project.workspace_id, target_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User must be a workspace member before joining a project.")
        if member_create.role_id is not None:
            self._get_active_role(member_create.role_id)
        if member_create.team_id is not None:
            team = self._get_team(member_create.team_id)
            if team.workspace_id != project.workspace_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team must belong to the project workspace.")
        if self.db.query(ProjectMembership).filter(ProjectMembership.project_id == project.id, ProjectMembership.user_id == target_user.id).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a project member.")
        member = ProjectMembership(
            project_id=project.id,
            user_id=target_user.id,
            role_id=member_create.role_id,
            team_id=member_create.team_id,
            status=member_create.status,
            joined_at=datetime.now(timezone.utc),
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        self._log("project.member_added", current_user.id, "project", project.id, "project_membership", member.id)
        ContextVersionService(self.db).bump_access("project", project.id)
        self.db.commit()
        return member

    def update_project_member(
        self,
        project_id: int,
        membership_id: int,
        member_update: ProjectMembershipUpdate,
        current_user: User,
    ) -> ProjectMembership:
        project = self._get_project(project_id)
        self._require_scope_manage(current_user, "project", project.id)
        member = self._get_project_membership(project.id, membership_id)
        if member_update.role_id is not None:
            self._get_active_role(member_update.role_id)
            member.role_id = member_update.role_id
        if member_update.team_id is not None:
            team = self._get_team(member_update.team_id)
            if team.workspace_id != project.workspace_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team must belong to the project workspace.")
            member.team_id = team.id
        if member_update.status is not None:
            member.status = member_update.status
        self.db.commit()
        self.db.refresh(member)
        self._log("project.member_changed", current_user.id, "project", project.id, "project_membership", member.id)
        ContextVersionService(self.db).bump_access("project", project.id)
        self.db.commit()
        return member

    def remove_project_member(self, project_id: int, membership_id: int, current_user: User) -> None:
        project = self._get_project(project_id)
        self._require_scope_manage(current_user, "project", project.id)
        member = self._get_project_membership(project.id, membership_id)
        member.status = "inactive"
        self.db.commit()
        self._log("project.member_removed", current_user.id, "project", project.id, "project_membership", member.id)
        ContextVersionService(self.db).bump_access("project", project.id)
        self.db.commit()

    def update_team_member(self, team_id: int, membership_id: int, member_update: TeamMemberUpdate, current_user: User) -> TeamMember:
        team = self._get_team(team_id)
        self._require_scope_manage(current_user, "team", team.id)
        member = self._get_team_membership(team.id, membership_id)
        if member_update.role_id is not None:
            self._get_active_role(member_update.role_id)
            member.role_id = member_update.role_id
        if member_update.member_role is not None:
            member.member_role = member_update.member_role
        if member_update.status is not None:
            member.status = member_update.status
        self.db.commit()
        self.db.refresh(member)
        self._log("team.member_changed", current_user.id, "team", team.id, "team_member", member.id)
        ContextVersionService(self.db).bump_access("workspace", team.workspace_id)
        self.db.commit()
        return member

    def remove_team_member_by_id(self, team_id: int, membership_id: int, current_user: User) -> None:
        team = self._get_team(team_id)
        self._require_scope_manage(current_user, "team", team.id)
        member = self._get_team_membership(team.id, membership_id)
        member.status = "inactive"
        self.db.commit()
        self._log("team.member_removed", current_user.id, "team", team.id, "team_member", member.id)
        ContextVersionService(self.db).bump_access("workspace", team.workspace_id)
        self.db.commit()

    def effective_permissions(self, user_id: int, scope_type: str, scope_id: int | None) -> dict:
        user = self._get_active_user(user_id)
        resolved = AccessControlService(self.db).get_user_permissions(user.id, scope_type, scope_id)
        active_roles = [role for role in resolved["roles"] if role["source_scope_type"] == scope_type and role["source_scope_id"] == scope_id]
        inherited_roles = [role for role in resolved["roles"] if role not in active_roles]
        return {
            "user": user,
            "active_roles": active_roles,
            "inherited_roles": inherited_roles,
            "permission_codes": resolved["permission_codes"],
            "scope_context": resolved["scope"],
        }

    def _get_assignment(self, assignment_id: int) -> RoleAssignment:
        assignment = self.db.get(RoleAssignment, assignment_id)
        if assignment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role assignment not found.")
        return assignment

    def _get_active_user(self, user_id: int) -> User:
        user = self.db.get(User, user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return user

    def _get_active_role(self, role_id: int) -> Role:
        role = self.db.get(Role, role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        return role

    def _get_project(self, project_id: int) -> Project:
        project = self.db.get(Project, project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        return project

    def _get_team(self, team_id: int) -> Team:
        team = self.db.get(Team, team_id)
        if team is None or not team.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")
        return team

    def _get_project_membership(self, project_id: int, membership_id: int) -> ProjectMembership:
        member = self.db.get(ProjectMembership, membership_id)
        if member is None or member.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project membership not found.")
        return member

    def _get_team_membership(self, team_id: int, membership_id: int) -> TeamMember:
        member = self.db.get(TeamMember, membership_id)
        if member is None or member.team_id != team_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team membership not found.")
        return member

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")

    def _ensure_scope_exists(self, scope_type: str, scope_id: int | None) -> None:
        if scope_type == "platform":
            return
        model = {"organization": Organization, "workspace": Workspace, "project": Project, "team": Team}[scope_type]
        if scope_id is None or self.db.get(model, scope_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{scope_type.title()} scope not found.")

    def _require_scope_manage(self, user: User, scope_type: str, scope_id: int | None) -> None:
        permission_by_scope = {
            "platform": "settings.role.manage",
            "organization": "settings.role.manage",
            "workspace": "settings.member.invite",
            "project": "settings.project.edit",
            "team": "settings.team.edit",
        }
        AccessControlService(self.db).require(user, permission_by_scope[scope_type], scope_type, scope_id)

    def _require_role_assignment_manage(self, user: User, scope_type: str, scope_id: int | None) -> None:
        AccessControlService(self.db).require(user, "settings.role.manage", scope_type, scope_id)

    def _can_assign_platform_hidden_roles(self, user: User) -> bool:
        if user.is_superuser:
            return True
        platform_owner = (
            self.db.query(Role)
            .filter(Role.key == "platform_owner", Role.scope == "platform", Role.is_active.is_(True))
            .first()
        )
        if platform_owner is None:
            return False
        if (
            self.db.query(UserRole.id)
            .filter(UserRole.user_id == user.id, UserRole.role_id == platform_owner.id)
            .first()
            is not None
        ):
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

    def _ensure_role_can_be_assigned(self, role: Role, current_user: User, scope_type: str) -> None:
        if role.scope == "platform" and scope_type != "platform":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Platform roles can only be assigned at platform scope.")
        if role.is_hidden and not self._can_assign_platform_hidden_roles(current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot assign this role.")

    def _ensure_not_last_protected_assignment(self, assignment: RoleAssignment) -> None:
        role = assignment.role
        if role is None or role.key not in {"superuser", "platform_owner"} or role.scope != "platform":
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

    def _ensure_project_access(self, project: Project, user: User) -> None:
        if user.is_superuser or self._is_workspace_member(project.workspace_id, user.id):
            return
        if AccessControlService(self.db).can_access_scope(user.id, "project", project.id):
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project.")

    def _is_workspace_member(self, workspace_id: int, user_id: int) -> bool:
        return (
            self.db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
            .first()
            is not None
        )

    def _cleanup_membership_after_last_role_removed(self, assignment: RoleAssignment) -> None:
        if assignment.scope_type == "platform" or assignment.scope_id is None:
            return
        has_active_role = (
            self.db.query(RoleAssignment.id)
            .filter(
                RoleAssignment.user_id == assignment.user_id,
                RoleAssignment.scope_type == assignment.scope_type,
                RoleAssignment.scope_id == assignment.scope_id,
                RoleAssignment.status == "active",
                RoleAssignment.id != assignment.id,
            )
            .first()
            is not None
        )
        if has_active_role:
            return
        if assignment.scope_type == "organization":
            membership = (
                self.db.query(OrganizationMember)
                .filter(OrganizationMember.organization_id == assignment.scope_id, OrganizationMember.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                self.db.delete(membership)
            return
        if assignment.scope_type == "workspace":
            membership = (
                self.db.query(WorkspaceMember)
                .filter(WorkspaceMember.workspace_id == assignment.scope_id, WorkspaceMember.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                self.db.delete(membership)
            return
        if assignment.scope_type == "project":
            membership = (
                self.db.query(ProjectMembership)
                .filter(ProjectMembership.project_id == assignment.scope_id, ProjectMembership.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                membership.status = "inactive"
            return
        if assignment.scope_type == "team":
            membership = (
                self.db.query(TeamMember)
                .filter(TeamMember.team_id == assignment.scope_id, TeamMember.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                membership.status = "inactive"

    def _update_scope_membership_role(self, assignment: RoleAssignment, role: Role) -> None:
        if assignment.scope_type == "organization":
            membership = (
                self.db.query(OrganizationMember)
                .filter(OrganizationMember.organization_id == assignment.scope_id, OrganizationMember.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                membership.role_id = role.id
                membership.member_role = role.key
            return
        if assignment.scope_type == "workspace":
            membership = (
                self.db.query(WorkspaceMember)
                .filter(WorkspaceMember.workspace_id == assignment.scope_id, WorkspaceMember.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                membership.role_id = role.id
                membership.member_role = role.key
            return
        if assignment.scope_type == "project":
            membership = (
                self.db.query(ProjectMembership)
                .filter(ProjectMembership.project_id == assignment.scope_id, ProjectMembership.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                membership.role_id = role.id
            return
        if assignment.scope_type == "team":
            membership = (
                self.db.query(TeamMember)
                .filter(TeamMember.team_id == assignment.scope_id, TeamMember.user_id == assignment.user_id)
                .first()
            )
            if membership is not None:
                membership.role_id = role.id
                membership.member_role = role.key

    def _ensure_memberships_for_assignment(self, assignment: RoleAssignment, actor_id: int) -> None:
        """Ensure OrganizationMember / WorkspaceMember records exist after a direct role assignment."""
        if assignment.scope_type == "organization" and assignment.scope_id is not None:
            exists = (
                self.db.query(OrganizationMember)
                .filter(
                    OrganizationMember.organization_id == assignment.scope_id,
                    OrganizationMember.user_id == assignment.user_id,
                )
                .first()
            )
            if exists is None:
                self.db.add(
                    OrganizationMember(
                        organization_id=assignment.scope_id,
                        user_id=assignment.user_id,
                        role_id=assignment.role_id,
                        member_role="member",
                    )
                )
        elif assignment.scope_type == "workspace" and assignment.scope_id is not None:
            workspace = self.db.get(Workspace, assignment.scope_id)
            if workspace is None:
                return
            ws_exists = (
                self.db.query(WorkspaceMember)
                .filter(
                    WorkspaceMember.workspace_id == workspace.id,
                    WorkspaceMember.user_id == assignment.user_id,
                )
                .first()
            )
            if ws_exists is None:
                self.db.add(
                    WorkspaceMember(
                        workspace_id=workspace.id,
                        user_id=assignment.user_id,
                        member_role="member",
                    )
                )
            if workspace.organization_id:
                org_exists = (
                    self.db.query(OrganizationMember)
                    .filter(
                        OrganizationMember.organization_id == workspace.organization_id,
                        OrganizationMember.user_id == assignment.user_id,
                    )
                    .first()
                )
                if org_exists is None:
                    self.db.add(
                        OrganizationMember(
                            organization_id=workspace.organization_id,
                            user_id=assignment.user_id,
                            member_role="member",
                        )
                    )
                org_member_role = (
                    self.db.query(Role)
                    .filter(Role.key == "organization_member", Role.is_active.is_(True))
                    .first()
                )
                if org_member_role and not self.db.query(RoleAssignment).filter(
                    RoleAssignment.user_id == assignment.user_id,
                    RoleAssignment.scope_type == "organization",
                    RoleAssignment.scope_id == workspace.organization_id,
                    RoleAssignment.status == "active",
                ).first():
                    self.db.add(
                        RoleAssignment(
                            user_id=assignment.user_id,
                            role_id=org_member_role.id,
                            scope_type="organization",
                            scope_id=workspace.organization_id,
                            status="active",
                            assigned_by=actor_id,
                            assigned_at=datetime.now(timezone.utc),
                        )
                    )

    def _log(self, action: str, actor_user_id: int, scope_type: str, scope_id: int | None, entity_type: str, entity_id: int) -> None:
        organization_id = scope_id if scope_type == "organization" else None
        workspace_id = scope_id if scope_type == "workspace" else None
        project_id = scope_id if scope_type == "project" else None
        if scope_type == "team" and scope_id is not None:
            team = self.db.get(Team, scope_id)
            workspace_id = team.workspace_id if team else None
            organization_id = team.workspace.organization_id if team and team.workspace else None
        self.db.add(
            ActivityLog(
                actor_user_id=actor_user_id,
                organization_id=organization_id,
                workspace_id=workspace_id,
                project_id=project_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id),
                description=f"{action} for {entity_type} {entity_id}.",
                summary=f"{action} for {entity_type} {entity_id}.",
            )
        )
        self.db.commit()
