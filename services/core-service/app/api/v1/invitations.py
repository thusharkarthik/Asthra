from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.invitation import Invitation
from app.models.user import User
from app.schemas.invitation import InvitationAccept, InvitationCreate, InvitationRead
from app.services.invitation_service import InvitationService


router = APIRouter()


@router.post("", response_model=InvitationRead, status_code=status.HTTP_201_CREATED)
def create_invitation(
    invitation_create: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Invitation:
    return InvitationService(db).create(invitation_create, current_user)


@router.get("", response_model=list[InvitationRead])
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Invitation]:
    return InvitationService(db).list(current_user)


@router.get("/{invitation_id}", response_model=InvitationRead)
def get_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Invitation:
    return InvitationService(db).get(invitation_id, current_user)


@router.post("/{invitation_id}/accept", response_model=InvitationRead)
def accept_invitation(
    invitation_id: int,
    invitation_accept: InvitationAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Invitation:
    return InvitationService(db).accept(invitation_id, invitation_accept, current_user)


@router.post("/{invitation_id}/revoke", response_model=InvitationRead)
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Invitation:
    return InvitationService(db).revoke(invitation_id, current_user)
