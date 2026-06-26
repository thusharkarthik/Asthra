from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import RoleAssignment, User
from app.schemas.scoped_membership import RoleAssignmentCreate, RoleAssignmentRead, RoleAssignmentUpdate
from app.services.access_control_service import AccessControlService
from app.services.scoped_membership_service import ScopedMembershipService

router = APIRouter()


@router.get("", response_model=list[RoleAssignmentRead])
def list_role_assignments(
    user_id: int | None = Query(default=None),
    role_id: int | None = Query(default=None),
    scope_type: str | None = Query(default=None),
    scope_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RoleAssignment]:
    return ScopedMembershipService(db).list_role_assignments(
        current_user,
        user_id=user_id,
        role_id=role_id,
        scope_type=scope_type,
        scope_id=scope_id,
        status_filter=status_filter,
    )


@router.post("", response_model=RoleAssignmentRead, status_code=status.HTTP_201_CREATED)
def create_role_assignment(
    assignment_create: RoleAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoleAssignment:
    return ScopedMembershipService(db).create_role_assignment(assignment_create, current_user)


@router.patch("/{assignment_id}", response_model=RoleAssignmentRead)
def update_role_assignment(
    assignment_id: int,
    assignment_update: RoleAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoleAssignment:
    assignment = db.get(RoleAssignment, assignment_id)
    if assignment is not None:
        AccessControlService(db).guard_superuser_self_removal(assignment.user_id, current_user)
    return ScopedMembershipService(db).update_role_assignment(assignment_id, assignment_update, current_user)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    assignment = db.get(RoleAssignment, assignment_id)
    if assignment is not None:
        AccessControlService(db).guard_superuser_self_removal(assignment.user_id, current_user)
    ScopedMembershipService(db).delete_role_assignment(assignment_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
