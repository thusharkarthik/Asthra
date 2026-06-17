from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.release import ReleaseAssignWorkItem, ReleaseCreate, ReleaseRead, ReleaseUpdate
from app.services.release_service import ReleaseService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and membership checks.
    return None


@router.post("", response_model=ReleaseRead, status_code=status.HTTP_201_CREATED)
def create_release(release_create: ReleaseCreate, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> ReleaseRead:
    return ReleaseService(db).create(release_create)


@router.get("", response_model=list[ReleaseRead])
def list_releases(
    project_id: int | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[ReleaseRead]:
    return ReleaseService(db).list(project_id=project_id, status_filter=status_filter, limit=limit, offset=offset)


@router.get("/{release_id}", response_model=ReleaseRead)
def get_release(release_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> ReleaseRead:
    return ReleaseService(db).get(release_id)


@router.patch("/{release_id}", response_model=ReleaseRead)
def update_release(release_id: int, release_update: ReleaseUpdate, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> ReleaseRead:
    return ReleaseService(db).update(release_id, release_update)


@router.delete("/{release_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_release(release_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> Response:
    ReleaseService(db).delete(release_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{release_id}/activate", response_model=ReleaseRead)
def activate_release(release_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> ReleaseRead:
    return ReleaseService(db).activate(release_id)


@router.post("/{release_id}/release", response_model=ReleaseRead)
def release_release(release_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> ReleaseRead:
    return ReleaseService(db).release(release_id)


@router.post("/{release_id}/work-items", response_model=ReleaseRead)
def assign_work_item_to_release(
    release_id: int,
    assignment: ReleaseAssignWorkItem,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> ReleaseRead:
    return ReleaseService(db).assign_work_item(release_id, assignment.work_item_id)
