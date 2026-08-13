from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.activity_log import ActivityLogFilter, ActivityLogRead
from app.services.activity_service import ActivityService

router = APIRouter()


@router.get("", response_model=list[ActivityLogRead])
def list_activity(
    entity_type: str | None = None,
    action: str | None = None,
    organization_id: int | None = None,
    workspace_id: int | None = None,
    project_id: int | None = None,
    actor_user_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ActivityLog]:
    filters = ActivityLogFilter(
        entity_type=entity_type,
        action=action,
        organization_id=organization_id,
        workspace_id=workspace_id,
        project_id=project_id,
        actor_user_id=actor_user_id,
        limit=limit,
        offset=offset,
    )
    return ActivityService(db).list(filters, current_user)


@router.get("/users/{user_id}", response_model=list[ActivityLogRead])
def list_user_activity(
    user_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ActivityLog]:
    return ActivityService(db).list_for_user(
        user_id,
        limit=limit,
        offset=offset,
        current_user=current_user,
    )


@router.get("/organizations/{organization_id}", response_model=list[ActivityLogRead])
def list_organization_activity(
    organization_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ActivityLog]:
    return ActivityService(db).list_for_organization(
        organization_id,
        limit=limit,
        offset=offset,
        current_user=current_user,
    )


@router.get("/workspaces/{workspace_id}", response_model=list[ActivityLogRead])
def list_workspace_activity(
    workspace_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ActivityLog]:
    return ActivityService(db).list_for_workspace(
        workspace_id,
        limit=limit,
        offset=offset,
        current_user=current_user,
    )


@router.get("/projects/{project_id}", response_model=list[ActivityLogRead])
def list_project_activity(
    project_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ActivityLog]:
    return ActivityService(db).list_for_project(
        project_id,
        limit=limit,
        offset=offset,
        current_user=current_user,
    )


@router.get("/{activity_id}", response_model=ActivityLogRead)
def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActivityLog:
    return ActivityService(db).get(activity_id, current_user)
