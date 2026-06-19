from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.access_control import CurrentUserPermissionsRead
from app.services.access_control_service import AccessControlService

router = APIRouter()


@router.get("/permissions", response_model=CurrentUserPermissionsRead)
def get_current_user_permissions(
    org_id: int | None = Query(default=None),
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    scope_type = "platform"
    scope_id: int | None = None
    if org_id is not None:
        scope_type = "organization"
        scope_id = org_id
    if workspace_id is not None:
        scope_type = "workspace"
        scope_id = workspace_id
    if project_id is not None:
        scope_type = "project"
        scope_id = project_id
    return AccessControlService(db).get_user_permissions(current_user.id, scope_type, scope_id)
