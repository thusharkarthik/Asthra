from __future__ import annotations

import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.role import Role, RolePermission
from app.models.user import User, UserRole
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.role import RoleCreate, RolePermissionCreate, RoleUpdate, UserRoleCreate


VALID_ROLE_SCOPES = {"global", "organization", "workspace", "project"}


class RoleService:
    def __init__(self, db: Session) -> None:
        self.role_repository = RoleRepository(db)
        self.permission_repository = PermissionRepository(db)

    def create(self, role_create: RoleCreate, current_user: User) -> Role:
        self._ensure_active_user(current_user)
        scope = self._validate_scope(role_create.scope)
        name = role_create.name.strip()
        if self.role_repository.get_by_scope_and_name(scope, name) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A role with this name already exists in this scope.",
            )
        return self.role_repository.create(
            name=name,
            key=self._keyify(name),
            description=role_create.description,
            scope=scope,
            organization_id=role_create.organization_id,
        )

    def list(self, current_user: User) -> list[Role]:
        self._ensure_active_user(current_user)
        return self.role_repository.list()

    def get(self, role_id: int, current_user: User) -> Role:
        self._ensure_active_user(current_user)
        role = self.role_repository.get_by_id(role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        return role

    def update(self, role_id: int, role_update: RoleUpdate, current_user: User) -> Role:
        role = self.get(role_id, current_user)
        if role_update.scope is not None:
            role_update.scope = self._validate_scope(role_update.scope)
        name = role_update.name.strip() if role_update.name is not None else role.name
        scope = role_update.scope if role_update.scope is not None else role.scope
        duplicate = self.role_repository.get_by_scope_and_name(scope, name)
        if duplicate is not None and duplicate.id != role.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A role with this name already exists in this scope.",
            )
        return self.role_repository.update(role, role_update)

    def delete(self, role_id: int, current_user: User) -> None:
        role = self.get(role_id, current_user)
        self.role_repository.update(role, RoleUpdate(is_active=False))

    def link_permission(
        self,
        role_id: int,
        link_create: RolePermissionCreate,
        current_user: User,
    ) -> RolePermission:
        role = self.get(role_id, current_user)
        permission = self.permission_repository.get_by_id(link_create.permission_id)
        if permission is None or not permission.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
        if self.role_repository.get_role_permission(role.id, permission.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Permission is already linked to this role.",
            )
        return self.role_repository.link_permission(role.id, permission.id)

    def list_permissions(self, role_id: int, current_user: User) -> list[RolePermission]:
        role = self.get(role_id, current_user)
        return self.role_repository.list_permissions(role.id)

    def unlink_permission(self, role_id: int, permission_id: int, current_user: User) -> None:
        role = self.get(role_id, current_user)
        role_permission = self.role_repository.get_role_permission(role.id, permission_id)
        if role_permission is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role permission link not found.",
            )
        self.role_repository.unlink_permission(role_permission)

    def assign_user_role(
        self,
        user_id: int,
        user_role_create: UserRoleCreate,
        current_user: User,
    ) -> UserRole:
        self._ensure_active_user(current_user)
        user = self.role_repository.get_user(user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        role = self.role_repository.get_by_id(user_role_create.role_id)
        if role is None or not role.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        if self.role_repository.get_user_role(user.id, role.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role is already assigned to this user.",
            )
        return self.role_repository.assign_user_role(user.id, role.id)

    def list_user_roles(self, user_id: int, current_user: User) -> list[UserRole]:
        self._ensure_active_user(current_user)
        user = self.role_repository.get_user(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return self.role_repository.list_user_roles(user.id)

    def remove_user_role(self, user_id: int, role_id: int, current_user: User) -> None:
        self._ensure_active_user(current_user)
        user = self.role_repository.get_user(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        user_role = self.role_repository.get_user_role(user.id, role_id)
        if user_role is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User role not found.")
        self.role_repository.remove_user_role(user_role)

    def _ensure_active_user(self, user: User) -> None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

    def _validate_scope(self, scope: str) -> str:
        normalized_scope = scope.strip().lower()
        if normalized_scope not in VALID_ROLE_SCOPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Role scope must be one of: global, organization, workspace, project.",
            )
        return normalized_scope

    def _keyify(self, value: str) -> str:
        key = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        return key or "role"
