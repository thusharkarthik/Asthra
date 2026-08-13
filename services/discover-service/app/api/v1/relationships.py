from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.lifecycle_relationship import LifecycleGraphRead, LifecycleRelationshipCreate, LifecycleRelationshipRead
from app.services.lifecycle_relationship_service import LifecycleRelationshipService

router = APIRouter()


@router.post("", response_model=LifecycleRelationshipRead, status_code=201)
def create_relationship(data: LifecycleRelationshipCreate, db: Session = Depends(get_db)):
    return LifecycleRelationshipService(db).create(data)


@router.get("", response_model=list[LifecycleRelationshipRead])
def list_relationships(
    source_type: str | None = Query(default=None),
    source_id: str | None = Query(default=None),
    target_type: str | None = Query(default=None),
    target_id: str | None = Query(default=None),
    relationship_type: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return LifecycleRelationshipService(db).list(
        source_type=source_type,
        source_id=source_id,
        target_type=target_type,
        target_id=target_id,
        relationship_type=relationship_type,
        limit=limit,
        offset=offset,
    )


@router.get("/lifecycle/ideas/{idea_id}", response_model=LifecycleGraphRead)
def get_idea_lifecycle_graph(idea_id: str, db: Session = Depends(get_db)):
    return LifecycleRelationshipService(db).lifecycle_graph_for_idea(idea_id)


@router.delete("/{relationship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relationship(relationship_id: int, db: Session = Depends(get_db)):
    LifecycleRelationshipService(db).delete(relationship_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
