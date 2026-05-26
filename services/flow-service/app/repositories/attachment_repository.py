from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.models.work_item_attachment import WorkItemAttachment
from app.schemas.attachment import WorkItemAttachmentCreate


class AttachmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_work_item(self, work_item_id: int) -> WorkItem | None:
        return self.db.get(WorkItem, work_item_id)

    def create(
        self,
        work_item_id: int,
        attachment_create: WorkItemAttachmentCreate,
    ) -> WorkItemAttachment:
        attachment = WorkItemAttachment(
            work_item_id=work_item_id,
            **attachment_create.model_dump(),
        )
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)
        return attachment

    def list_for_work_item(self, work_item_id: int) -> list[WorkItemAttachment]:
        statement = (
            select(WorkItemAttachment)
            .where(
                WorkItemAttachment.work_item_id == work_item_id,
                WorkItemAttachment.is_active.is_(True),
            )
            .order_by(WorkItemAttachment.id)
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, attachment_id: int) -> WorkItemAttachment | None:
        return self.db.get(WorkItemAttachment, attachment_id)

    def delete(self, attachment: WorkItemAttachment) -> None:
        attachment.is_active = False
        self.db.add(attachment)
        self.db.commit()
