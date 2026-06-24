from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserProfileUpdate
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
        ActivityService(self.db).log_activity(
            actor_user_id=current_user.id,
            entity_type="user",
            entity_id=str(current_user.id),
            action="user.profile_updated",
            description=f"User {current_user.id} profile was updated.",
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

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive.")
