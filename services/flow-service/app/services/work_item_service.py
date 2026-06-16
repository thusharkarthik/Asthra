import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.repositories.work_item_repository import WorkItemRepository
from app.schemas.work_item import WorkItemAIBreakdownRead, WorkItemCreate, WorkItemMemoryDocumentPayload, WorkItemUpdate
from app.services.ai_client import AIClient
from app.services.activity_service import ActivityService
from app.services.event_publisher import publish_event

logger = logging.getLogger(__name__)


class WorkItemService:
    def __init__(self, db: Session) -> None:
        self.work_item_repository = WorkItemRepository(db)
        self.activity_service = ActivityService(db)

    def create(self, work_item_create: WorkItemCreate) -> WorkItem:
        logger.info(
            "flow.work_item.create.received",
            extra={"payload": work_item_create.model_dump()},
        )
        work_item_create = self._apply_create_defaults(work_item_create)
        logger.info(
            "flow.work_item.create.defaults_resolved",
            extra={
                "type_id": work_item_create.type_id,
                "status_id": work_item_create.status_id,
                "priority_id": work_item_create.priority_id,
                "reporter_id": work_item_create.reporter_id,
            },
        )
        self._validate_required_ids(work_item_create.project_id)
        self._validate_references(
            type_id=work_item_create.type_id,
            status_id=work_item_create.status_id,
            priority_id=work_item_create.priority_id,
        )
        self._validate_board_linkage(
            project_id=work_item_create.project_id,
            board_id=work_item_create.board_id,
            board_column_id=work_item_create.board_column_id,
        )
        work_item = self.work_item_repository.create(work_item_create)
        self.activity_service.log_activity(
            action="work_item.created",
            entity_type="work_item",
            entity_id=str(work_item.id),
            actor_user_id=work_item.reporter_id,
            project_id=work_item.project_id,
            work_item_id=work_item.id,
            description=f"Work item '{work_item.title}' was created.",
        )
        publish_event(
            "flow.work_item.created",
            payload={"title": work_item.title, "project_id": work_item.project_id},
            actor_user_id=work_item.reporter_id,
            entity_type="work_item",
            entity_id=str(work_item.id),
        )
        return work_item

    def list(
        self,
        *,
        status_id: int | None = None,
        assignee_id: int | None = None,
        project_id: int | None = None,
        priority_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[WorkItem]:
        return self.work_item_repository.list(
            status_id=status_id,
            assignee_id=assignee_id,
            project_id=project_id,
            priority_id=priority_id,
            limit=limit,
            offset=offset,
        )

    def get(self, work_item_id: int) -> WorkItem:
        work_item = self.work_item_repository.get_by_id(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )
        return work_item

    def update(self, work_item_id: int, work_item_update: WorkItemUpdate) -> WorkItem:
        work_item = self.get(work_item_id)
        self._validate_references(
            type_id=work_item_update.type_id,
            status_id=work_item_update.status_id,
            priority_id=work_item_update.priority_id,
        )
        self._validate_board_linkage(
            project_id=work_item.project_id,
            board_id=work_item_update.board_id,
            board_column_id=work_item_update.board_column_id,
        )
        updated_work_item = self.work_item_repository.update(work_item, work_item_update)
        self.activity_service.log_activity(
            action="work_item.updated",
            entity_type="work_item",
            entity_id=str(updated_work_item.id),
            actor_user_id=updated_work_item.reporter_id,
            project_id=updated_work_item.project_id,
            work_item_id=updated_work_item.id,
            description=f"Work item '{updated_work_item.title}' was updated.",
            metadata={"updated_fields": list(work_item_update.model_dump(exclude_unset=True))},
        )
        publish_event(
            "flow.work_item.updated",
            payload={
                "title": updated_work_item.title,
                "project_id": updated_work_item.project_id,
                "updated_fields": list(work_item_update.model_dump(exclude_unset=True)),
            },
            actor_user_id=updated_work_item.reporter_id,
            entity_type="work_item",
            entity_id=str(updated_work_item.id),
        )
        return updated_work_item

    def delete(self, work_item_id: int) -> None:
        work_item = self.get(work_item_id)
        self.work_item_repository.delete(work_item)

    def ai_breakdown(self, work_item_id: int, request_id: str | None = None) -> WorkItemAIBreakdownRead:
        work_item = self.get(work_item_id)
        # TODO: Later tiers can optionally create actual subtasks from this response.
        prompt = (
            "Break this work item into implementation subtasks. Respond as JSON with keys: "
            "subtasks, acceptance_criteria, risks, dependencies, estimated_complexity.\n\n"
            f"Title: {work_item.title}\nDescription: {work_item.description or 'No description'}"
        )
        result = AIClient().complete(
            prompt,
            system_prompt="You are a pragmatic engineering lead. Return concise JSON only.",
            request_id=request_id,
        )
        return WorkItemAIBreakdownRead(
            work_item_id=work_item.id,
            subtasks=result.get("subtasks") or [],
            acceptance_criteria=result.get("acceptance_criteria") or [],
            risks=result.get("risks") or [],
            dependencies=result.get("dependencies") or [],
            estimated_complexity=result.get("estimated_complexity"),
            raw_response=result.get("raw_response"),
        )

    def prepare_memory_document(self, work_item_id: int) -> WorkItemMemoryDocumentPayload:
        work_item = self.get(work_item_id)
        # TODO: Resolve workspace_id from Core Service project membership when service-to-service lookup is available.
        return WorkItemMemoryDocumentPayload(
            external_reference=f"work_item:{work_item.id}",
            workspace_id=0,
            title=work_item.title,
            content=work_item.description or work_item.title,
            metadata={
                "work_item_id": work_item.id,
                "project_id": work_item.project_id,
                "type_id": work_item.type_id,
                "status_id": work_item.status_id,
                "priority_id": work_item.priority_id,
                "assignee_id": work_item.assignee_id,
                "reporter_id": work_item.reporter_id,
            },
        )

    def _apply_create_defaults(self, work_item_create: WorkItemCreate) -> WorkItemCreate:
        update_data: dict[str, int] = {}
        if work_item_create.type_id is None:
            update_data["type_id"] = self.work_item_repository.get_or_create_default_type().id
        if work_item_create.status_id is None:
            update_data["status_id"] = self.work_item_repository.get_or_create_default_status().id
        if work_item_create.priority_id is None:
            update_data["priority_id"] = self.work_item_repository.get_or_create_default_priority().id
        if work_item_create.reporter_id is None:
            # MVP fallback for unauthenticated UI creates and existing SQLite volumes
            # that were created before reporter_id became nullable.
            update_data["reporter_id"] = 0
        return work_item_create.model_copy(update=update_data)

    def _validate_required_ids(self, project_id: int) -> None:
        if project_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id is required.",
            )

    def _validate_references(
        self,
        *,
        type_id: int | None,
        status_id: int | None,
        priority_id: int | None,
    ) -> None:
        if type_id is not None and not self.work_item_repository.type_exists(type_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item type not found.",
            )
        if status_id is not None and not self.work_item_repository.status_exists(status_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item status not found.",
            )
        if priority_id is not None and not self.work_item_repository.priority_exists(priority_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item priority not found.",
            )

    def _validate_board_linkage(
        self,
        *,
        project_id: int,
        board_id: int | None,
        board_column_id: int | None,
    ) -> None:
        board = None
        if board_id is not None:
            board = self.work_item_repository.get_board(board_id)
            if board is None or not board.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
            if board.project_id != project_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Board must belong to the same project as the work item.",
                )

        if board_column_id is not None:
            board_column = self.work_item_repository.get_board_column(board_column_id)
            if board_column is None or not board_column.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Board column not found.",
                )
            if board_id is not None and board_column.board_id != board_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Board column must belong to the selected board.",
                )
            if board_id is None and board_column.board.project_id != project_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Board column must belong to a board in the work item's project.",
                )
