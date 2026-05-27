from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.roadmap_item import RoadmapItemCreate, RoadmapItemRead, RoadmapItemUpdate
from app.services.roadmap_item_service import RoadmapItemService

router = APIRouter()


@router.post("", response_model=RoadmapItemRead, status_code=201)
def create_roadmap_item(data: RoadmapItemCreate, db: Session = Depends(get_db)):
    return RoadmapItemService(db).create(data)


@router.get("", response_model=list[RoadmapItemRead])
def list_roadmap_items(
    workspace_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    target_quarter: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return RoadmapItemService(db).list(
        workspace_id=workspace_id,
        status=status,
        target_quarter=target_quarter,
        limit=limit,
        offset=offset,
    )


@router.patch("/{roadmap_item_id}", response_model=RoadmapItemRead)
def update_roadmap_item(roadmap_item_id: int, data: RoadmapItemUpdate, db: Session = Depends(get_db)):
    return RoadmapItemService(db).update(roadmap_item_id, data)


@router.delete("/{roadmap_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap_item(roadmap_item_id: int, db: Session = Depends(get_db)):
    RoadmapItemService(db).delete(roadmap_item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
