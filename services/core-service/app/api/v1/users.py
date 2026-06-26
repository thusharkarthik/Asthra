from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.role import UserRoleCreate, UserRoleRead
from app.schemas.scoped_membership import EffectivePermissionsRead
from app.schemas.user import UserProfileRead, UserProfileUpdate
from app.services.access_control_service import AccessControlService
from app.services.role_service import RoleService
from app.services.scoped_membership_service import ScopedMembershipService
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserProfileRead)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    return UserService(db).get_me(current_user)


@router.patch("/me", response_model=UserProfileRead)
def update_me(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    return UserService(db).update_me(profile_update, current_user)


@router.get("", response_model=list[UserProfileRead])
@router.get("/", response_model=list[UserProfileRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[User]:
    return UserService(db).list_users(current_user)


@router.get("/{user_id}", response_model=UserProfileRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    return UserService(db).get_user(user_id, current_user)


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
    AccessControlService(db).guard_superuser_self_removal(user_id, current_user)
    RoleService(db).remove_user_role(user_id, role_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{user_id}/effective-permissions", response_model=EffectivePermissionsRead)
def get_user_effective_permissions(
    user_id: int,
    scope_type: str = Query(default="platform"),
    scope_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    # current_user is required for authentication; detailed viewer permissions are handled in Settings UI for now.
    _ = current_user
    return ScopedMembershipService(db).effective_permissions(user_id, scope_type, scope_id)
