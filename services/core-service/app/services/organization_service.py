from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.services.access_control_service import AccessControlService
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
        return organization

    def list(self, current_user: User) -> list[Organization]:
        self._ensure_active_user(current_user)
        if current_user.is_superuser:
            return self.organization_repository.list_all()
        return self.organization_repository.list_for_user(current_user.id)

    def get(self, organization_id: int, current_user: User) -> Organization:
        self._ensure_active_user(current_user)
        organization = self.organization_repository.get_by_id(organization_id)
        if organization is None or not organization.is_active:
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
        AccessControlService(self.db).require(
            current_user,
            "settings.organization.manage",
            "organization",
            organization.id,
        )
        organization = self.organization_repository.update(organization, organization_update)
        ContextVersionService(self.db).bump_organization_context(organization.id)
        self.db.commit()
        self.db.refresh(organization)
        return organization

    def delete(self, organization_id: int, current_user: User) -> None:
        organization = self.get(organization_id, current_user)
        AccessControlService(self.db).require(
            current_user,
            "settings.organization.manage",
            "organization",
            organization.id,
        )
        self.organization_repository.update(organization, OrganizationUpdate(is_active=False))
        ContextVersionService(self.db).bump_organization_context(organization.id)
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization.",
        )

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
