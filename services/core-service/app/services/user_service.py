from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import ChangePasswordPayload, UserProfileUpdate
from app.services.activity_service import ActivityService
from app.services.access_control_service import AccessControlService


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.user_repository = UserRepository(db)

    def get_me(self, current_user: User) -> User:
        self._ensure_active_user(current_user)
        return current_user

    def update_me(self, profile_update: UserProfileUpdate, current_user: User) -> User:
        self._ensure_active_user(current_user)
        user = self.user_repository.update_profile(current_user, profile_update)
        changed_fields = [k for k in profile_update.model_dump(exclude_none=True)]
        fields_label = ", ".join(changed_fields) if changed_fields else "profile"
        actor_name = current_user.full_name or current_user.email
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            entity_type="user",
            entity_id=str(current_user.id),
            action="user.profile_updated",
            description=f"{actor_name} updated their profile ({fields_label}).",
        )
        return user

    def get_user(self, user_id: int, current_user: User) -> User:
        self._ensure_active_user(current_user)
        user = self.user_repository.get_by_id(user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if current_user.is_superuser or current_user.id == user_id:
            return user
        if self.user_repository.shares_membership(current_user.id, user_id):
            return user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid user access.")

    def list_users(self, current_user: User) -> list[User]:
        self._ensure_active_user(current_user)
        access = AccessControlService(self.db)
        if not current_user.is_superuser and not access.can(current_user.id, "settings.member.view", "platform", None):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission required: settings.member.view")
        return self.user_repository.list_active()

    def change_password(self, payload: ChangePasswordPayload, current_user: User) -> None:
        self._ensure_active_user(current_user)
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )
        if verify_password(payload.new_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from the current password.",
            )
        current_user.hashed_password = hash_password(payload.new_password)
        self.db.commit()
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            entity_type="user",
            entity_id=str(current_user.id),
            action="user.password_changed",
            description=f"User {current_user.id} changed their password.",
        )

    def deactivate_me(self, current_user: User) -> None:
        self._ensure_active_user(current_user)
        if current_user.is_superuser:
            active_superuser_count = (
                self.db.query(User)
                .filter(User.is_superuser.is_(True), User.is_active.is_(True))
                .count()
            )
            if active_superuser_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate account: you are the only active superuser.",
                )
        current_user.is_active = False
        self.db.commit()
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            entity_type="user",
            entity_id=str(current_user.id),
            action="user.deactivated",
            description=f"User {current_user.id} deactivated their account.",
        )

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")
