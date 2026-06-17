from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, status
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.work_item import WorkItem
from app.models.work_item_attachment import WorkItemAttachment
from app.repositories.attachment_repository import AttachmentRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.attachment import WorkItemAttachmentCreate
from app.services.activity_service import ActivityService
from app.services.audit_service import AuditService


class AttachmentService:
    def __init__(self, db: Session) -> None:
        self.attachment_repository = AttachmentRepository(db)
        self.activity_service = ActivityService(db)
        self.audit_service = AuditService(db)

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
        self._record_attachment_uploaded(work_item, attachment)
        return attachment

    async def create_from_upload(
        self,
        work_item_id: int,
        uploaded_file: UploadFile,
        uploaded_by_id: int | None = None,
    ) -> WorkItemAttachment:
        work_item = self._get_active_work_item(work_item_id)
        original_name = uploaded_file.filename or "attachment"
        safe_name = Path(original_name).name.replace("/", "_").replace("\\", "_")
        stored_name = f"{uuid4().hex}_{safe_name}"
        storage_dir = Path(settings.attachment_storage_dir)
        storage_dir.mkdir(parents=True, exist_ok=True)
        storage_path = storage_dir / stored_name
        content = await uploaded_file.read()
        storage_path.write_bytes(content)

        attachment = self.attachment_repository.create(
            work_item_id,
            WorkItemAttachmentCreate(
                file_name=safe_name,
                file_url=str(storage_path),
                file_type=uploaded_file.content_type,
                file_size=len(content),
                uploaded_by_id=uploaded_by_id,
            ),
        )
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
        self._record_attachment_uploaded(work_item, attachment)
        return attachment

    def list_for_work_item(self, work_item_id: int) -> list[WorkItemAttachment]:
        self._get_active_work_item(work_item_id)
        return self.attachment_repository.list_for_work_item(work_item_id)

    def delete(self, work_item_id: int, attachment_id: int) -> None:
        work_item = self._get_active_work_item(work_item_id)
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
        audit_attachment_id = attachment.id
        uploaded_by_id = attachment.uploaded_by_id
        file_name = attachment.file_name
        file_type = attachment.file_type
        self.attachment_repository.delete(attachment)
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="attachment",
                entity_id=str(audit_attachment_id),
                action="attachment.deleted",
                actor_id=uploaded_by_id,
                old_value=file_name,
                metadata={"file_name": file_name, "file_type": file_type},
            )
        )

    def get_download_path(self, work_item_id: int, attachment_id: int) -> Path:
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
        path = Path(attachment.file_url)
        if not path.exists() or not path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment file not found.",
            )
        return path

    def _get_active_work_item(self, work_item_id: int) -> WorkItem:
        work_item = self.attachment_repository.get_work_item(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )
        return work_item

    def _record_attachment_uploaded(self, work_item: WorkItem, attachment: WorkItemAttachment) -> None:
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="attachment",
                entity_id=str(attachment.id),
                action="attachment.uploaded",
                actor_id=attachment.uploaded_by_id,
                new_value=attachment.file_name,
                metadata={"file_name": attachment.file_name, "file_type": attachment.file_type},
            )
        )
