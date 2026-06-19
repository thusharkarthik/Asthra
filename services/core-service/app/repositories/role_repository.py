from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role, RolePermission
from app.models.user import User, UserRole
from app.schemas.role import RoleUpdate


class RoleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, role_id: int) -> Role | None:
        return self.db.get(Role, role_id)

    def get_by_scope_and_name(self, scope: str, name: str) -> Role | None:
        statement = select(Role).where(Role.scope == scope, Role.name == name)
        return self.db.scalar(statement)

    def list(self, *, include_inactive: bool = False) -> list[Role]:
        statement = select(Role).order_by(Role.created_at.desc())
        if not include_inactive:
            statement = statement.where(Role.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def create(
        self,
        *,
        name: str,
        key: str,
        description: str | None,
        scope: str,
        organization_id: int | None,
        is_system: bool = False,
        is_editable: bool = True,
    ) -> Role:
        role = Role(
            name=name,
            key=key,
            description=description,
            scope=scope,
            organization_id=organization_id,
            is_system=is_system,
            is_editable=is_editable,
        )
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def update(self, role: Role, role_update: RoleUpdate) -> Role:
        update_data = role_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(role, field, value)
        if "name" in update_data:
            role.key = update_data["name"].strip().lower().replace(" ", "-")
        self.db.commit()
        self.db.refresh(role)
        return role

    def get_role_permission(self, role_id: int, permission_id: int) -> RolePermission | None:
        statement = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        return self.db.scalar(statement)

    def link_permission(self, role_id: int, permission_id: int) -> RolePermission:
        role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
        self.db.add(role_permission)
        self.db.commit()
        self.db.refresh(role_permission)
        return role_permission

    def unlink_permission(self, role_permission: RolePermission) -> None:
        self.db.delete(role_permission)
        self.db.commit()

    def replace_permissions(self, role_id: int, permission_ids: list[int]) -> list[RolePermission]:
        existing = self.list_permissions(role_id)
        wanted = set(permission_ids)
        for role_permission in existing:
            if role_permission.permission_id not in wanted:
                self.db.delete(role_permission)
        existing_permission_ids = {role_permission.permission_id for role_permission in existing}
        for permission_id in permission_ids:
            if permission_id not in existing_permission_ids:
                self.db.add(RolePermission(role_id=role_id, permission_id=permission_id))
        self.db.commit()
        return self.list_permissions(role_id)

    def list_permissions(self, role_id: int) -> list[RolePermission]:
        statement = (
            select(RolePermission)
            .where(RolePermission.role_id == role_id)
            .order_by(RolePermission.created_at.asc())
        )
        return list(self.db.scalars(statement).all())

    def get_user(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_user_role(self, user_id: int, role_id: int) -> UserRole | None:
        statement = select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
        return self.db.scalar(statement)

    def assign_user_role(self, user_id: int, role_id: int) -> UserRole:
        user_role = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(user_role)
        self.db.commit()
        self.db.refresh(user_role)
        return user_role

    def remove_user_role(self, user_role: UserRole) -> None:
        self.db.delete(user_role)
        self.db.commit()

    def list_user_roles(self, user_id: int) -> list[UserRole]:
        statement = select(UserRole).where(UserRole.user_id == user_id).order_by(UserRole.created_at.asc())
        return list(self.db.scalars(statement).all())
