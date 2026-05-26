from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.organization import Organization, OrganizationMember
from app.schemas.organization import OrganizationUpdate


class OrganizationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, organization_id: int) -> Organization | None:
        return self.db.get(Organization, organization_id)

    def get_by_slug(self, slug: str) -> Organization | None:
        statement = select(Organization).where(Organization.slug == slug)
        return self.db.scalar(statement)

    def list_for_user(self, user_id: int, *, include_inactive: bool = False) -> list[Organization]:
        statement = (
            select(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(OrganizationMember.user_id == user_id)
            .order_by(Organization.created_at.desc())
        )
        if not include_inactive:
            statement = statement.where(Organization.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def list_all(self, *, include_inactive: bool = False) -> list[Organization]:
        statement = select(Organization).order_by(Organization.created_at.desc())
        if not include_inactive:
            statement = statement.where(Organization.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def is_member(self, organization_id: int, user_id: int) -> bool:
        statement = select(OrganizationMember.id).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def create_with_owner(
        self,
        *,
        name: str,
        slug: str,
        description: str | None,
        created_by_id: int,
    ) -> Organization:
        organization = Organization(
            name=name,
            slug=slug,
            description=description,
            created_by_id=created_by_id,
        )
        self.db.add(organization)
        self.db.flush()

        self.db.add(
            OrganizationMember(
                organization_id=organization.id,
                user_id=created_by_id,
                member_role="owner",
            )
        )
        self.db.add(
            ActivityLog(
                actor_user_id=created_by_id,
                organization_id=organization.id,
                action="organization.created",
                entity_type="organization",
                entity_id=str(organization.id),
                description=f"Organization '{organization.name}' was created.",
                summary=f"Organization '{organization.name}' was created.",
            )
        )
        self.db.commit()
        self.db.refresh(organization)
        return organization

    def update(
        self,
        organization: Organization,
        organization_update: OrganizationUpdate,
    ) -> Organization:
        update_data = organization_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(organization, field, value)
        self.db.commit()
        self.db.refresh(organization)
        return organization

    def list_members(self, organization_id: int) -> list[OrganizationMember]:
        statement = (
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == organization_id)
            .order_by(OrganizationMember.created_at.asc())
        )
        return list(self.db.scalars(statement).all())
