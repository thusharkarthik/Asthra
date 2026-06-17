from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.team_capacity import TeamCapacity
from app.schemas.capacity import TeamCapacityCreate, TeamCapacityRead, TeamCapacityUpdate

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and membership checks.
    return None


@router.post("", response_model=TeamCapacityRead, status_code=status.HTTP_201_CREATED)
def create_capacity(
    capacity_create: TeamCapacityCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> TeamCapacity:
    capacity = TeamCapacity(**capacity_create.model_dump())
    db.add(capacity)
    db.commit()
    db.refresh(capacity)
    return capacity


@router.get("", response_model=list[TeamCapacityRead])
def list_capacity(
    project_id: int | None = None,
    sprint_id: int | None = None,
    user_id: int | None = None,
    team_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[TeamCapacity]:
    statement = select(TeamCapacity).order_by(TeamCapacity.id.desc()).offset(offset).limit(limit)
    if project_id is not None:
        statement = statement.where(TeamCapacity.project_id == project_id)
    if sprint_id is not None:
        statement = statement.where(TeamCapacity.sprint_id == sprint_id)
    if user_id is not None:
        statement = statement.where(TeamCapacity.user_id == user_id)
    if team_id is not None:
        statement = statement.where(TeamCapacity.team_id == team_id)
    return list(db.scalars(statement).all())


@router.patch("/{capacity_id}", response_model=TeamCapacityRead)
def update_capacity(
    capacity_id: int,
    capacity_update: TeamCapacityUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> TeamCapacity:
    capacity = db.get(TeamCapacity, capacity_id)
    if capacity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capacity entry not found.")
    for field, value in capacity_update.model_dump(exclude_unset=True).items():
        setattr(capacity, field, value)
    db.add(capacity)
    db.commit()
    db.refresh(capacity)
    return capacity


@router.delete("/{capacity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_capacity(
    capacity_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    capacity = db.get(TeamCapacity, capacity_id)
    if capacity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capacity entry not found.")
    db.delete(capacity)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
