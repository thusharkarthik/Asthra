from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.schemas.role import PermissionCreate, PermissionUpdate


class PermissionService:
    def __init__(self, db: Session) -> None:
        self.permission_repository = PermissionRepository(db)

    def create(self, permission_create: PermissionCreate, current_user: User) -> Permission:
        self._ensure_active_user(current_user)
        code = self._normalize_code(permission_create.code)
        if self.permission_repository.get_by_code(code) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A permission with this code already exists.",
            )
        return self.permission_repository.create(
            code=code,
            name=permission_create.name.strip(),
            description=permission_create.description,
        )

    def list(self, current_user: User) -> list[Permission]:
        self._ensure_active_user(current_user)
        return self.permission_repository.list()

    def get(self, permission_id: int, current_user: User) -> Permission:
        self._ensure_active_user(current_user)
        permission = self.permission_repository.get_by_id(permission_id)
        if permission is None or not permission.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
        return permission

    def update(
        self,
        permission_id: int,
        permission_update: PermissionUpdate,
        current_user: User,
    ) -> Permission:
        permission = self.get(permission_id, current_user)
        if permission_update.code is not None:
            permission_update.code = self._normalize_code(permission_update.code)
            duplicate = self.permission_repository.get_by_code(permission_update.code)
            if duplicate is not None and duplicate.id != permission.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A permission with this code already exists.",
                )
        if permission_update.name is not None:
            permission_update.name = permission_update.name.strip()
        return self.permission_repository.update(permission, permission_update)

    def delete(self, permission_id: int, current_user: User) -> None:
        permission = self.get(permission_id, current_user)
        self.permission_repository.update(permission, PermissionUpdate(is_active=False))

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _normalize_code(self, code: str) -> str:
        return code.strip().lower()
