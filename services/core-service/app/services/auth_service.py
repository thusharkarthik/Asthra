from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.invitation import Invitation
from app.models.notification import Notification
from app.models.role import Role
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.notification_service import NotificationService
from app.schemas.auth import Token
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.user_repository = UserRepository(db)

    def register(self, user_create: UserCreate) -> User:
        existing_user = self.user_repository.get_by_email(user_create.email)
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )

        user = self.user_repository.create(
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=hash_password(user_create.password),
        )
        self._sync_pending_invitation_notifications(user)
        return user

    def login(self, *, email: str, password: str) -> Token:
        user = self.user_repository.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        self._sync_pending_invitation_notifications(user)
        return Token(access_token=create_access_token(subject=str(user.id)))

    def get_current_user(self, user_id: int) -> User:
        user = self.user_repository.get_by_id(user_id)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        self._sync_pending_invitation_notifications(user)
        return user

    def _sync_pending_invitation_notifications(self, user: User) -> None:
        invitations = self.db.scalars(
            select(Invitation).where(
                Invitation.email == user.email.lower(),
                Invitation.status == "pending",
            )
        ).all()
        notification_service = NotificationService(self.db)
        for invitation in invitations:
            existing = self.db.scalar(
                select(Notification.id).where(
                    Notification.user_id == user.id,
                    Notification.type == "invitation.pending",
                    Notification.entity_type == "invitation",
                    Notification.entity_id == str(invitation.id),
                )
            )
            if existing is not None:
                continue
            role = self.db.get(Role, invitation.role_id) if invitation.role_id else None
            role_name = role.name if role else "Member"
            notification_service.create_notification(
                user_id=user.id,
                type="invitation.pending",
                title="Asthra invitation",
                message=f"You have been invited to Asthra as {role_name}.",
                organization_id=invitation.organization_id,
                workspace_id=invitation.workspace_id,
                entity_type="invitation",
                entity_id=str(invitation.id),
            )
