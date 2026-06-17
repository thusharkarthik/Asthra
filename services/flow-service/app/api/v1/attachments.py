from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
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
async def create_work_item_attachment(
    work_item_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemAttachment:
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            attachment_create = WorkItemAttachmentCreate.model_validate(await request.json())
        except ValidationError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors()) from exc
        return AttachmentService(db).create(work_item_id, attachment_create)

    if "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file")
        uploaded_by_value = form.get("uploaded_by_id")
        uploaded_by_id = int(str(uploaded_by_value)) if uploaded_by_value else None
        if hasattr(file, "read") and hasattr(file, "filename"):
            return await AttachmentService(db).create_from_upload(work_item_id, file, uploaded_by_id)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Attachment file is required.")

    raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Use JSON metadata or multipart form upload.")


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


@router.get("/work-items/{work_item_id}/attachments/{attachment_id}/download")
def download_work_item_attachment(
    work_item_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> FileResponse:
    path = AttachmentService(db).get_download_path(work_item_id, attachment_id)
    return FileResponse(path)
