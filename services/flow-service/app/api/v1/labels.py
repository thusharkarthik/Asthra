from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.work_item_label import WorkItemLabel
from app.schemas.label import WorkItemLabelAssign, WorkItemLabelCreate, WorkItemLabelRead
from app.services.label_service import LabelService

router = APIRouter()
work_item_router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post("", response_model=WorkItemLabelRead, status_code=status.HTTP_201_CREATED)
def create_label(
    label_create: WorkItemLabelCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemLabel:
    return LabelService(db).create(label_create)


@router.get("", response_model=list[WorkItemLabelRead])
def list_labels(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkItemLabel]:
    return LabelService(db).list(project_id=project_id)


@work_item_router.post(
    "/work-items/{work_item_id}/labels",
    response_model=WorkItemLabelRead,
    status_code=status.HTTP_201_CREATED,
)
def add_label_to_work_item(
    work_item_id: int,
    label_assign: WorkItemLabelAssign,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkItemLabel:
    return LabelService(db).add_to_work_item(work_item_id, label_assign)
