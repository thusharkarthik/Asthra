from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.sprint import SprintAssignWorkItem, SprintCreate, SprintRead, SprintUpdate
from app.services.sprint_service import SprintService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and membership checks.
    return None


@router.post("", response_model=SprintRead, status_code=status.HTTP_201_CREATED)
def create_sprint(sprint_create: SprintCreate, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> SprintRead:
    return SprintService(db).create(sprint_create)


@router.get("", response_model=list[SprintRead])
def list_sprints(
    project_id: int | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[SprintRead]:
    return SprintService(db).list(project_id=project_id, status_filter=status_filter, limit=limit, offset=offset)


@router.get("/{sprint_id}", response_model=SprintRead)
def get_sprint(sprint_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> SprintRead:
    return SprintService(db).get(sprint_id)


@router.patch("/{sprint_id}", response_model=SprintRead)
def update_sprint(sprint_id: int, sprint_update: SprintUpdate, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> SprintRead:
    return SprintService(db).update(sprint_id, sprint_update)


@router.delete("/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sprint(sprint_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> Response:
    SprintService(db).delete(sprint_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{sprint_id}/start", response_model=SprintRead)
def start_sprint(sprint_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> SprintRead:
    return SprintService(db).start(sprint_id)


@router.post("/{sprint_id}/complete", response_model=SprintRead)
def complete_sprint(sprint_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> SprintRead:
    return SprintService(db).complete(sprint_id)


@router.post("/{sprint_id}/work-items", response_model=SprintRead)
def assign_work_item_to_sprint(
    sprint_id: int,
    assignment: SprintAssignWorkItem,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> SprintRead:
    return SprintService(db).assign_work_item(sprint_id, assignment.work_item_id)
