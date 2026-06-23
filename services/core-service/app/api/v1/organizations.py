from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationMemberRead,
    OrganizationMemberUpdate,
    OrganizationRead,
    OrganizationUpdate,
)
from app.schemas.settings import OrganizationSettingsRead, OrganizationSettingsUpdate
from app.services.membership_service import MembershipService
from app.services.organization_service import OrganizationService
from app.services.settings_service import SettingsService

router = APIRouter()


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
def create_organization(
    organization_create: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    return OrganizationService(db).create(organization_create, current_user)


@router.get("", response_model=list[OrganizationRead])
def list_organizations(
    status_filter: str | None = Query(default=None, alias="status"),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Organization]:
    return OrganizationService(db).list(current_user, status_filter=status_filter, include_inactive=include_inactive)


@router.get("/{organization_id}", response_model=OrganizationRead)
def get_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    return OrganizationService(db).get(organization_id, current_user)


@router.patch("/{organization_id}", response_model=OrganizationRead)
def update_organization(
    organization_id: int,
    organization_update: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    return OrganizationService(db).update(
        organization_id,
        organization_update,
        current_user,
    )


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    OrganizationService(db).delete(organization_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{organization_id}/members", response_model=list[OrganizationMemberRead])
def list_organization_members(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrganizationMember]:
    return OrganizationService(db).list_members(organization_id, current_user)


@router.patch("/{organization_id}/members/{user_id}", response_model=OrganizationMemberRead)
def update_organization_member(
    organization_id: int,
    user_id: int,
    member_update: OrganizationMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationMember:
    return MembershipService(db).update_organization_member(organization_id, user_id, member_update, current_user)


@router.get("/{organization_id}/settings", response_model=OrganizationSettingsRead)
def get_organization_settings(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationSettingsRead:
    return SettingsService(db).get_organization_settings(organization_id, current_user)


@router.patch("/{organization_id}/settings", response_model=OrganizationSettingsRead)
def update_organization_settings(
    organization_id: int,
    settings_update: OrganizationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationSettingsRead:
    return SettingsService(db).update_organization_settings(
        organization_id,
        settings_update,
        current_user,
    )


@router.delete("/{organization_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_organization_member(
    organization_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    MembershipService(db).remove_organization_member(organization_id, user_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
