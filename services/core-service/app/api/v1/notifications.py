from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import AccessRequestCreate, NotificationFilter, NotificationRead
from app.services.notification_service import NotificationService


router = APIRouter()


@router.post("/access-request")
def send_access_request(
    payload: AccessRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, bool]:
    return NotificationService(db).send_access_request(payload.page, payload.message, current_user)


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    is_read: bool | None = None,
    type: str | None = None,
    organization_id: int | None = None,
    workspace_id: int | None = None,
    project_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Notification]:
    filters = NotificationFilter(
        is_read=is_read,
        type=type,
        organization_id=organization_id,
        workspace_id=workspace_id,
        project_id=project_id,
        limit=limit,
        offset=offset,
    )
    return NotificationService(db).list(filters, current_user)


@router.patch("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    return NotificationService(db).mark_all_read(current_user)


@router.get("/{notification_id}", response_model=NotificationRead)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Notification:
    return NotificationService(db).get(notification_id, current_user)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Notification:
    return NotificationService(db).mark_read(notification_id, current_user)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    NotificationService(db).delete(notification_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
