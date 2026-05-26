from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.role import UserRoleCreate, UserRoleRead
from app.services.role_service import RoleService

router = APIRouter()


@router.post("/{user_id}/roles", response_model=UserRoleRead, status_code=status.HTTP_201_CREATED)
def assign_user_role(
    user_id: int,
    user_role_create: UserRoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRole:
    return RoleService(db).assign_user_role(user_id, user_role_create, current_user)


@router.get("/{user_id}/roles", response_model=list[UserRoleRead])
def list_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserRole]:
    return RoleService(db).list_user_roles(user_id, current_user)


@router.delete("/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    RoleService(db).remove_user_role(user_id, role_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
