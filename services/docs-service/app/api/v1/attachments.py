from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.page_attachment import PageAttachment
from app.schemas.attachment import PageAttachmentCreate, PageAttachmentRead
from app.services.attachment_service import AttachmentService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and page access checks.
    return None


@router.post(
    "/pages/{page_id}/attachments",
    response_model=PageAttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_page_attachment(
    page_id: int,
    attachment_create: PageAttachmentCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> PageAttachment:
    return AttachmentService(db).create(page_id, attachment_create)


@router.get("/pages/{page_id}/attachments", response_model=list[PageAttachmentRead])
def list_page_attachments(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[PageAttachment]:
    return AttachmentService(db).list_for_page(page_id)


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    AttachmentService(db).delete(attachment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
