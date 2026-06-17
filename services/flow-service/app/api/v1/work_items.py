from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.work_item import WorkItem
from app.schemas.work_item import (
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
        limit=limit,
        offset=offset,
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
