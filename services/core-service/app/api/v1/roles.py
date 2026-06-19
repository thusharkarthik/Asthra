from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.role import Role, RolePermission
from app.models.user import User
from app.schemas.role import (
    RoleCreate,
    RolePermissionCreate,
    RolePermissionRead,
    RolePermissionsReplace,
    RoleRead,
    RoleUpdate,
)
from app.services.role_service import RoleService

router = APIRouter()


@router.post("", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    role_create: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Role:
    return RoleService(db).create(role_create, current_user)


@router.get("", response_model=list[RoleRead])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Role]:
    return RoleService(db).list(current_user)


@router.get("/{role_id}", response_model=RoleRead)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Role:
    return RoleService(db).get(role_id, current_user)


@router.patch("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Role:
    return RoleService(db).update(role_id, role_update, current_user)


@router.put("/{role_id}", response_model=RoleRead)
def replace_role(
    role_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Role:
    return RoleService(db).update(role_id, role_update, current_user)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    RoleService(db).delete(role_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{role_id}/permissions", response_model=RolePermissionRead, status_code=status.HTTP_201_CREATED)
def link_role_permission(
    role_id: int,
    link_create: RolePermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RolePermission:
    return RoleService(db).link_permission(role_id, link_create, current_user)


@router.get("/{role_id}/permissions", response_model=list[RolePermissionRead])
def list_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RolePermission]:
    return RoleService(db).list_permissions(role_id, current_user)


@router.put("/{role_id}/permissions", response_model=list[RolePermissionRead])
def replace_role_permissions(
    role_id: int,
    replace_create: RolePermissionsReplace,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RolePermission]:
    return RoleService(db).replace_permissions(role_id, replace_create, current_user)


@router.delete("/{role_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_role_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    RoleService(db).unlink_permission(role_id, permission_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
