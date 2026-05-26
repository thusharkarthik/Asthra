from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.space import Space
from app.repositories.space_repository import SpaceRepository
from app.schemas.space import SpaceCreate, SpaceUpdate


class SpaceService:
    def __init__(self, db: Session) -> None:
        self.space_repository = SpaceRepository(db)

    def create(self, space_create: SpaceCreate) -> Space:
        if space_create.workspace_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="workspace_id is required.",
            )
        return self.space_repository.create(space_create)

    def list(self, *, workspace_id: int | None = None) -> list[Space]:
        return self.space_repository.list(workspace_id=workspace_id)

    def get(self, space_id: int) -> Space:
        space = self.space_repository.get_by_id(space_id)
        if space is None or not space.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found.")
        return space

    def update(self, space_id: int, space_update: SpaceUpdate) -> Space:
        space = self.get(space_id)
        return self.space_repository.update(space, space_update)

    def delete(self, space_id: int) -> None:
        space = self.get(space_id)
        self.space_repository.delete(space)
