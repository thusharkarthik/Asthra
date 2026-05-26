from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.page_attachment import PageAttachment
from app.repositories.attachment_repository import AttachmentRepository
from app.schemas.attachment import PageAttachmentCreate


class AttachmentService:
    def __init__(self, db: Session) -> None:
        self.attachment_repository = AttachmentRepository(db)

    def create(self, page_id: int, attachment_create: PageAttachmentCreate) -> PageAttachment:
        self._ensure_active_page(page_id)
        return self.attachment_repository.create(page_id, attachment_create)

    def list_for_page(self, page_id: int) -> list[PageAttachment]:
        self._ensure_active_page(page_id)
        return self.attachment_repository.list_for_page(page_id)

    def delete(self, attachment_id: int) -> None:
        attachment = self.attachment_repository.get_by_id(attachment_id)
        if attachment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found.",
            )
        self.attachment_repository.delete(attachment)

    def _ensure_active_page(self, page_id: int) -> None:
        page = self.attachment_repository.get_page(page_id)
        if page is None or not page.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found.")
