from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.models.work_item_attachment import WorkItemAttachment
from app.repositories.attachment_repository import AttachmentRepository
from app.schemas.attachment import WorkItemAttachmentCreate
from app.services.activity_service import ActivityService


class AttachmentService:
    def __init__(self, db: Session) -> None:
        self.attachment_repository = AttachmentRepository(db)
        self.activity_service = ActivityService(db)

    def create(
        self,
        work_item_id: int,
        attachment_create: WorkItemAttachmentCreate,
    ) -> WorkItemAttachment:
        work_item = self._get_active_work_item(work_item_id)
        attachment = self.attachment_repository.create(work_item_id, attachment_create)
        self.activity_service.log_activity(
            action="attachment.added",
            entity_type="attachment",
            entity_id=str(attachment.id),
            actor_user_id=attachment.uploaded_by_id,
            project_id=work_item.project_id,
            work_item_id=work_item.id,
            description=f"Attachment added to work item '{work_item.title}'.",
            metadata={"file_name": attachment.file_name, "file_type": attachment.file_type},
        )
        return attachment

    def list_for_work_item(self, work_item_id: int) -> list[WorkItemAttachment]:
        self._get_active_work_item(work_item_id)
        return self.attachment_repository.list_for_work_item(work_item_id)

    def delete(self, work_item_id: int, attachment_id: int) -> None:
        self._get_active_work_item(work_item_id)
        attachment = self.attachment_repository.get_by_id(attachment_id)
        if (
            attachment is None
            or not attachment.is_active
            or attachment.work_item_id != work_item_id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found.",
            )
        self.attachment_repository.delete(attachment)

    def _get_active_work_item(self, work_item_id: int) -> WorkItem:
        work_item = self.attachment_repository.get_work_item(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )
        return work_item
