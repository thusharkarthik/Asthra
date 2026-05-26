from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.work_item_attachment import WorkItemAttachment
from app.schemas.attachment import WorkItemAttachmentCreate, WorkItemAttachmentRead
from app.services.attachment_service import AttachmentService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post(
    "/work-items/{work_item_id}/attachments",
    response_model=WorkItemAttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_work_item_attachment(
    work_item_id: int,
    attachment_create: WorkItemAttachmentCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemAttachment:
    return AttachmentService(db).create(work_item_id, attachment_create)


@router.get(
    "/work-items/{work_item_id}/attachments",
    response_model=list[WorkItemAttachmentRead],
)
def list_work_item_attachments(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkItemAttachment]:
    return AttachmentService(db).list_for_work_item(work_item_id)


@router.delete(
    "/work-items/{work_item_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_work_item_attachment(
    work_item_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    AttachmentService(db).delete(work_item_id, attachment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
