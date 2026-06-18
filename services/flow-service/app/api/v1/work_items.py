from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.work_item import WorkItem
from app.schemas.search import WorkItemSearchParams, WorkItemSearchResponse
from app.schemas.work_item import (
    LinkedEntityCreate,
    LinkedEntityRead,
    ProjectHierarchyRead,
    WorkItemAIBreakdownRead,
    WorkItemCreate,
    WorkItemMemoryDocumentPayload,
    WorkItemParentUpdate,
    WorkItemRead,
    WorkItemRelationCreate,
    WorkItemRelationRead,
    WorkItemUpdate,
)
from app.services.work_item_service import WorkItemService

router = APIRouter()
project_router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and membership checks.
    return None


@router.post("", response_model=WorkItemRead, status_code=status.HTTP_201_CREATED)
def create_work_item(
    work_item_create: WorkItemCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItem:
    return WorkItemService(db).create(work_item_create)


@router.get("", response_model=list[WorkItemRead])
def list_work_items(
    status_id: int | None = None,
    assignee_id: int | None = None,
    project_id: int | None = None,
    priority_id: int | None = None,
    sprint_id: int | None = None,
    release_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkItem]:
    return WorkItemService(db).list(
        status_id=status_id,
        assignee_id=assignee_id,
        project_id=project_id,
        priority_id=priority_id,
        sprint_id=sprint_id,
        release_id=release_id,
        limit=limit,
        offset=offset,
    )


@router.get("/search", response_model=WorkItemSearchResponse)
def search_work_items(
    text: str | None = None,
    title: str | None = None,
    description: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    assignee_id: int | None = None,
    reporter_id: int | None = None,
    effort_size: str | None = None,
    business_value: str | None = None,
    risk_level: str | None = None,
    complexity: str | None = None,
    sprint_id: int | None = None,
    release_id: int | None = None,
    parent_id: int | None = None,
    item_level: str | None = None,
    created_after: str | None = None,
    created_before: str | None = None,
    updated_after: str | None = None,
    updated_before: str | None = None,
    due_before: str | None = None,
    due_after: str | None = None,
    project_id: int | None = None,
    sort_by: str = "updated_at",
    sort_direction: str = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemSearchResponse:
    return WorkItemService(db).search(
        WorkItemSearchParams(
            text=text,
            title=title,
            description=description,
            status=status,
            priority=priority,
            assignee_id=assignee_id,
            reporter_id=reporter_id,
            effort_size=effort_size,
            business_value=business_value,
            risk_level=risk_level,
            complexity=complexity,
            sprint_id=sprint_id,
            release_id=release_id,
            parent_id=parent_id,
            item_level=item_level,
            created_after=created_after,
            created_before=created_before,
            updated_after=updated_after,
            updated_before=updated_before,
            due_before=due_before,
            due_after=due_after,
            project_id=project_id,
            sort_by=sort_by,
            sort_direction=sort_direction,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{work_item_id}", response_model=WorkItemRead)
def get_work_item(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItem:
    return WorkItemService(db).get(work_item_id)


@router.post("/{work_item_id}/ai-breakdown", response_model=WorkItemAIBreakdownRead)
def ai_breakdown_work_item(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemAIBreakdownRead:
    return WorkItemService(db).ai_breakdown(work_item_id)


@router.post("/{work_item_id}/prepare-memory-document", response_model=WorkItemMemoryDocumentPayload)
def prepare_memory_document(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemMemoryDocumentPayload:
    return WorkItemService(db).prepare_memory_document(work_item_id)


@router.patch("/{work_item_id}", response_model=WorkItemRead)
def update_work_item(
    work_item_id: int,
    work_item_update: WorkItemUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItem:
    return WorkItemService(db).update(work_item_id, work_item_update)


@router.delete("/{work_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_item(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    WorkItemService(db).delete(work_item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@project_router.get("/{project_id}/hierarchy", response_model=ProjectHierarchyRead)
def get_project_hierarchy(
    project_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> ProjectHierarchyRead:
    return WorkItemService(db).get_project_hierarchy(project_id)


@router.post("/{work_item_id}/subtasks", response_model=WorkItemRead, status_code=status.HTTP_201_CREATED)
def create_subtask(
    work_item_id: int,
    subtask_create: WorkItemCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItem:
    return WorkItemService(db).create_subtask(work_item_id, subtask_create)


@router.patch("/{work_item_id}/parent", response_model=WorkItemRead)
def update_work_item_parent(
    work_item_id: int,
    parent_update: WorkItemParentUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItem:
    return WorkItemService(db).update_parent(work_item_id, parent_update)


@router.get("/{work_item_id}/children", response_model=list[WorkItemRead])
def list_work_item_children(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkItem]:
    return WorkItemService(db).list_children(work_item_id)


@router.post("/{work_item_id}/relations", response_model=WorkItemRelationRead, status_code=status.HTTP_201_CREATED)
def create_work_item_relation(
    work_item_id: int,
    relation_create: WorkItemRelationCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemRelationRead:
    relation = WorkItemService(db).create_relation(work_item_id, relation_create)
    return WorkItemRelationRead.model_validate(relation)


@router.get("/{work_item_id}/relations", response_model=list[WorkItemRelationRead])
def list_work_item_relations(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkItemRelationRead]:
    return WorkItemService(db).list_relations(work_item_id)


@router.delete("/{work_item_id}/relations/{relation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_item_relation(
    work_item_id: int,
    relation_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    WorkItemService(db).delete_relation(work_item_id, relation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{work_item_id}/links", response_model=LinkedEntityRead, status_code=status.HTTP_201_CREATED)
def create_work_item_link(
    work_item_id: int,
    link_create: LinkedEntityCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> LinkedEntityRead:
    return LinkedEntityRead.model_validate(WorkItemService(db).create_link(work_item_id, link_create))


@router.get("/{work_item_id}/links", response_model=list[LinkedEntityRead])
def list_work_item_links(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[LinkedEntityRead]:
    return WorkItemService(db).list_links(work_item_id)


@router.delete("/{work_item_id}/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_item_link(
    work_item_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    WorkItemService(db).delete_link(work_item_id, link_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
