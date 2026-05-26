from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.permission import Permission
from app.models.user import User
from app.schemas.role import PermissionCreate, PermissionRead, PermissionUpdate
from app.services.permission_service import PermissionService


router = APIRouter()


@router.post("", response_model=PermissionRead, status_code=status.HTTP_201_CREATED)
def create_permission(
    permission_create: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Permission:
    return PermissionService(db).create(permission_create, current_user)


@router.get("", response_model=list[PermissionRead])
def list_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Permission]:
    return PermissionService(db).list(current_user)


@router.get("/{permission_id}", response_model=PermissionRead)
def get_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Permission:
    return PermissionService(db).get(permission_id, current_user)


@router.patch("/{permission_id}", response_model=PermissionRead)
def update_permission(
    permission_id: int,
    permission_update: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Permission:
    return PermissionService(db).update(permission_id, permission_update, current_user)


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    PermissionService(db).delete(permission_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
