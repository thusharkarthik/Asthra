from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.page import Page
from app.models.page_attachment import PageAttachment
from app.schemas.attachment import PageAttachmentCreate


class AttachmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_page(self, page_id: int) -> Page | None:
        return self.db.get(Page, page_id)

    def create(self, page_id: int, attachment_create: PageAttachmentCreate) -> PageAttachment:
        attachment = PageAttachment(page_id=page_id, **attachment_create.model_dump())
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)
        return attachment

    def list_for_page(self, page_id: int) -> list[PageAttachment]:
        statement = (
            select(PageAttachment)
            .where(PageAttachment.page_id == page_id)
            .order_by(PageAttachment.id)
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, attachment_id: int) -> PageAttachment | None:
        return self.db.get(PageAttachment, attachment_id)

    def delete(self, attachment: PageAttachment) -> None:
        self.db.delete(attachment)
        self.db.commit()
