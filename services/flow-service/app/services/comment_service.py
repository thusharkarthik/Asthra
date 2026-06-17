from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.work_item_comment import WorkItemComment
from app.repositories.comment_repository import CommentRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.comment import WorkItemCommentCreate, WorkItemCommentUpdate
from app.services.activity_service import ActivityService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService


class CommentService:
    def __init__(self, db: Session) -> None:
        self.comment_repository = CommentRepository(db)
        self.activity_service = ActivityService(db)
        self.audit_service = AuditService(db)
        self.notification_service = NotificationService(db)

    def create(
        self,
        work_item_id: int,
        comment_create: WorkItemCommentCreate,
        *,
        run_automation: bool = True,
    ) -> WorkItemComment:
        work_item = self._ensure_work_item(work_item_id)
        if not comment_create.body or not comment_create.body.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Comment content is required.",
            )
        comment = self.comment_repository.create(work_item_id, comment_create)
        self.activity_service.log_activity(
            action="comment.added",
            entity_type="comment",
            entity_id=str(comment.id),
            actor_user_id=comment.author_user_id,
            project_id=work_item.project_id,
            work_item_id=work_item.id,
            description=f"Comment added to work item '{work_item.title}'.",
        )
        self.notification_service.create_for_work_item(
            work_item=work_item,
            notification_type="comment_added",
            title="Comment added",
            message=f"New comment on '{work_item.title}'.",
            user_id=work_item.assignee_id,
        )
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="comment",
                entity_id=str(comment.id),
                action="comment.added",
                actor_id=comment.author_user_id,
                new_value=comment.body,
            )
        )
        if run_automation:
            from app.services.automation_rule_service import AutomationRuleService

            AutomationRuleService(self.comment_repository.db).execute_for_event(
                "comment_added",
                work_item,
                event_payload={"comment_id": comment.id, "author_user_id": comment.author_user_id},
            )
        return comment

    def list_for_work_item(self, work_item_id: int) -> list[WorkItemComment]:
        self._ensure_work_item(work_item_id)
        return self.comment_repository.list_for_work_item(work_item_id)

    def update(self, work_item_id: int, comment_id: int, comment_update: WorkItemCommentUpdate) -> WorkItemComment:
        work_item = self._ensure_work_item(work_item_id)
        comment = self._get_comment(work_item_id, comment_id)
        if not comment_update.body or not comment_update.body.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment content is required.")
        old_body = comment.body
        updated = self.comment_repository.update(comment, comment_update.body)
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="comment",
                entity_id=str(updated.id),
                action="comment.edited",
                actor_id=updated.author_user_id,
                old_value=old_body,
                new_value=updated.body,
            )
        )
        return updated

    def delete(self, work_item_id: int, comment_id: int) -> None:
        work_item = self._ensure_work_item(work_item_id)
        comment = self._get_comment(work_item_id, comment_id)
        audit_comment_id = comment.id
        actor_id = comment.author_user_id
        old_body = comment.body
        self.comment_repository.delete(comment)
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="comment",
                entity_id=str(audit_comment_id),
                action="comment.deleted",
                actor_id=actor_id,
                old_value=old_body,
            )
        )

    def _ensure_work_item(self, work_item_id: int):
        work_item = self.comment_repository.get_work_item(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )
        return work_item

    def _get_comment(self, work_item_id: int, comment_id: int) -> WorkItemComment:
        comment = self.comment_repository.get_by_id(comment_id)
        if comment is None or not comment.is_active or comment.work_item_id != work_item_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        return comment
