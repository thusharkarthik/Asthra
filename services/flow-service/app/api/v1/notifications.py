from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.flow_notification import FlowNotification
from app.schemas.notification import FlowNotificationRead
from app.services.notification_service import NotificationService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and scoped notification access.
    return None


@router.get("", response_model=list[FlowNotificationRead])
def list_notifications(
    workspace_id: int | None = None,
    project_id: int | None = None,
    user_id: int | None = None,
    unread_only: bool = False,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[FlowNotification]:
    return NotificationService(db).list(
        workspace_id=workspace_id,
        project_id=project_id,
        user_id=user_id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )


@router.patch("/{notification_id}/read", response_model=FlowNotificationRead)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> FlowNotification:
    return NotificationService(db).mark_read(notification_id)


@router.patch("/read-all", response_model=list[FlowNotificationRead])
def mark_all_notifications_read(
    workspace_id: int | None = None,
    project_id: int | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[FlowNotification]:
    return NotificationService(db).mark_all_read(workspace_id=workspace_id, project_id=project_id, user_id=user_id)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    NotificationService(db).delete(notification_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
