from __future__ import annotations

import re
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.organization import Organization, OrganizationMember
from app.models.role import Role
from app.models.user import RoleAssignment, User
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, PlatformOnboardCreate
from app.services.access_control_service import AccessControlService
from app.services.activity_service import ActivityService
from app.services.context_version_service import ContextVersionService
from app.services.event_publisher import publish_event


class OrganizationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.organization_repository = OrganizationRepository(db)

    def create(
        self,
        organization_create: OrganizationCreate,
        current_user: User,
    ) -> Organization:
        self._ensure_active_user(current_user)
        slug = self._build_unique_slug(organization_create.name)
        organization = self.organization_repository.create_with_owner(
            name=organization_create.name.strip(),
            slug=slug,
            description=organization_create.description,
            created_by_id=current_user.id,
        )
        publish_event(
            "core.organization.created",
            payload={"name": organization.name},
            organization_id=organization.id,
            actor_user_id=current_user.id,
            entity_type="organization",
            entity_id=str(organization.id),
        )
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization.id,
            entity_type="organization",
            entity_id=str(organization.id),
            action="organization.created",
            description=f"Organization '{organization.name}' was created by {actor_name}.",
        )
        self.db.commit()
        self.db.refresh(organization)
        return organization

    def onboard(
        self,
        organization_create: OrganizationCreate,
        current_user: User,
    ) -> Organization:
        self._ensure_active_user(current_user)
        existing_assignment = (
            self.db.query(RoleAssignment)
            .filter(
                RoleAssignment.user_id == current_user.id,
                RoleAssignment.status == "active",
                RoleAssignment.scope_type.in_(["organization", "workspace", "project", "team"]),
            )
            .first()
        )
        if existing_assignment is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have access to an organization.",
            )
        slug = self._build_unique_slug(organization_create.name)
        organization = self.organization_repository.create_with_owner(
            name=organization_create.name.strip(),
            slug=slug,
            description=organization_create.description,
            created_by_id=current_user.id,
        )
        org_owner_role = (
            self.db.query(Role)
            .filter(Role.key == "organization_owner", Role.is_active.is_(True))
            .first()
        )
        if org_owner_role is not None:
            self.db.add(
                RoleAssignment(
                    user_id=current_user.id,
                    role_id=org_owner_role.id,
                    scope_type="organization",
                    scope_id=organization.id,
                    status="active",
                    assigned_by=current_user.id,
                    assigned_at=datetime.now(timezone.utc),
                )
            )
        self.db.add(
            Notification(
                user_id=current_user.id,
                organization_id=organization.id,
                type="onboarding",
                title="Welcome to Asthra",
                message=f"Your organization '{organization.name}' has been created. You are now the Organization Owner.",
                entity_type="organization",
                entity_id=str(organization.id),
            )
        )
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization.id,
            entity_type="organization",
            entity_id=str(organization.id),
            action="organization.created",
            description=f"Organization '{organization.name}' was created by {actor_name} via self-serve onboarding.",
        )
        self.db.commit()
        self.db.refresh(organization)
        publish_event(
            "core.organization.created",
            payload={"name": organization.name, "via": "onboarding"},
            organization_id=organization.id,
            actor_user_id=current_user.id,
            entity_type="organization",
            entity_id=str(organization.id),
        )
        return organization

    def platform_onboard(
        self,
        payload: PlatformOnboardCreate,
        current_user: User,
    ) -> Organization:
        self._ensure_active_user(current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.organization.create",
            "platform",
            None,
        )
        owner = (
            self.db.query(User)
            .filter(User.id == payload.owner_user_id, User.is_active.is_(True))
            .first()
        )
        if owner is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Owner user not found or is inactive.",
            )
        slug = self._build_unique_slug(payload.name)
        organization = Organization(
            name=payload.name.strip(),
            slug=slug,
            description=payload.description,
            created_by_id=current_user.id,
        )
        self.db.add(organization)
        self.db.flush()
        self.db.add(
            OrganizationMember(
                organization_id=organization.id,
                user_id=owner.id,
                member_role="owner",
            )
        )
        org_owner_role = (
            self.db.query(Role)
            .filter(Role.key == "organization_owner", Role.is_active.is_(True))
            .first()
        )
        if org_owner_role is not None:
            self.db.add(
                RoleAssignment(
                    user_id=owner.id,
                    role_id=org_owner_role.id,
                    scope_type="organization",
                    scope_id=organization.id,
                    status="active",
                    assigned_by=current_user.id,
                    assigned_at=datetime.now(timezone.utc),
                )
            )
        admin_name = current_user.full_name or current_user.email
        owner_name = owner.full_name or owner.email
        self.db.add(
            Notification(
                user_id=owner.id,
                organization_id=organization.id,
                type="onboarding",
                title="You've been assigned as Organization Owner",
                message=(
                    f"You have been assigned as Organization Owner for "
                    f"'{organization.name}' by {admin_name}."
                ),
                entity_type="organization",
                entity_id=str(organization.id),
            )
        )
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization.id,
            entity_type="organization",
            entity_id=str(organization.id),
            action="platform.org_onboarded",
            description=f"Organization '{organization.name}' was created via platform onboarding by {admin_name}. Owner assigned: {owner_name}.",
        )
        self.db.commit()
        self.db.refresh(organization)
        publish_event(
            "core.organization.created",
            payload={"name": organization.name, "via": "platform-onboard"},
            organization_id=organization.id,
            actor_user_id=current_user.id,
            entity_type="organization",
            entity_id=str(organization.id),
        )
        return organization

    def list(
        self,
        current_user: User,
        *,
        status_filter: str | None = None,
        include_inactive: bool = False,
    ) -> list[Organization]:
        self._ensure_active_user(current_user)
        include_all = include_inactive or status_filter in {"all", "inactive", "archived"}
        if current_user.is_superuser:
            organizations = self.organization_repository.list_all(include_inactive=include_all)
        else:
            organizations = self.organization_repository.list_for_user(current_user.id, include_inactive=include_all)
        if status_filter == "inactive":
            organizations = [organization for organization in organizations if not organization.is_active]
        elif status_filter == "active":
            organizations = [organization for organization in organizations if organization.is_active]
        self._attach_owner_names(organizations)
        return organizations

    def _attach_owner_names(self, organizations: list[Organization]) -> None:
        if not organizations:
            return
        org_ids = [org.id for org in organizations]
        owner_pairs = (
            self.db.query(RoleAssignment, User)
            .join(User, User.id == RoleAssignment.user_id)
            .join(Role, Role.id == RoleAssignment.role_id)
            .filter(
                RoleAssignment.scope_type == "organization",
                RoleAssignment.scope_id.in_(org_ids),
                RoleAssignment.status == "active",
                Role.key == "organization_owner",
                Role.is_active.is_(True),
            )
            .all()
        )
        owner_map: dict[int, str] = {
            assignment.scope_id: user.full_name or user.email
            for assignment, user in owner_pairs
            if assignment.scope_id is not None
        }
        for org in organizations:
            org.owner_name = owner_map.get(org.id)

    def get(self, organization_id: int, current_user: User) -> Organization:
        self._ensure_active_user(current_user)
        organization = self.organization_repository.get_by_id(organization_id)
        if organization is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found.",
            )
        self._ensure_organization_access(organization, current_user)
        return organization

    def update(
        self,
        organization_id: int,
        organization_update: OrganizationUpdate,
        current_user: User,
    ) -> Organization:
        organization = self.get(organization_id, current_user)
        was_active = organization.is_active
        permission_code = self._permission_for_organization_update(organization, organization_update)
        AccessControlService(self.db).require(current_user, permission_code, "organization", organization.id)
        organization = self.organization_repository.update(organization, organization_update)
        ContextVersionService(self.db).bump_organization_context(organization.id)
        actor_name = current_user.full_name or current_user.email
        if permission_code == "settings.organization.archive":
            action = "organization.deactivated"
            verb = "deactivated"
        elif permission_code == "settings.organization.restore":
            action = "organization.reactivated"
            verb = "reactivated"
        else:
            action = "organization.updated"
            verb = "updated"
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization.id,
            entity_type="organization",
            entity_id=str(organization.id),
            action=action,
            description=f"Organization '{organization.name}' was {verb} by {actor_name}.",
        )
        self.db.commit()
        self.db.refresh(organization)
        return organization

    def delete(self, organization_id: int, current_user: User) -> None:
        organization = self.get(organization_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.organization.archive",
            "organization",
            organization.id,
        )
        self.organization_repository.update(organization, OrganizationUpdate(is_active=False))
        ContextVersionService(self.db).bump_organization_context(organization.id)
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            organization_id=organization.id,
            entity_type="organization",
            entity_id=str(organization.id),
            action="organization.deactivated",
            description=f"Organization '{organization.name}' was deactivated by {actor_name}.",
        )
        self.db.commit()

    def list_members(
        self,
        organization_id: int,
        current_user: User,
    ) -> list[OrganizationMember]:
        self.get(organization_id, current_user)
        return self.organization_repository.list_members(organization_id)

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _ensure_organization_access(self, organization: Organization, user: User) -> None:
        if user.is_superuser or organization.created_by_id == user.id:
            return
        if self.organization_repository.is_member(organization.id, user.id):
            return
        if AccessControlService(self.db).can_access_scope(user.id, "organization", organization.id):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization.",
        )

    def _permission_for_organization_update(self, organization: Organization, organization_update: OrganizationUpdate) -> str:
        restoring = organization.is_active is False and organization_update.is_active is True
        archiving = organization_update.is_active is False
        if restoring:
            return "settings.organization.restore"
        if archiving:
            return "settings.organization.archive"
        return "settings.organization.edit"

    def _build_unique_slug(self, name: str) -> str:
        base_slug = self._slugify(name)
        slug = base_slug
        suffix = 2
        while self.organization_repository.get_by_slug(slug) is not None:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        return slug

    def _slugify(self, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        return slug or "organization"
