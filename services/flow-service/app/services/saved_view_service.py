from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.saved_view import SavedView
from app.repositories.saved_view_repository import SavedViewRepository
from app.schemas.saved_view import SavedViewCreate, SavedViewUpdate


class SavedViewService:
    def __init__(self, db: Session) -> None:
        self.saved_view_repository = SavedViewRepository(db)

    def create(self, saved_view_create: SavedViewCreate) -> SavedView:
        return self.saved_view_repository.create(saved_view_create)

    def list(
        self,
        *,
        workspace_id: int | None = None,
        project_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[SavedView]:
        return self.saved_view_repository.list(workspace_id=workspace_id, project_id=project_id, limit=limit, offset=offset)

    def get(self, saved_view_id: int) -> SavedView:
        saved_view = self.saved_view_repository.get(saved_view_id)
        if saved_view is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved view not found.")
        return saved_view

    def update(self, saved_view_id: int, saved_view_update: SavedViewUpdate) -> SavedView:
        return self.saved_view_repository.update(self.get(saved_view_id), saved_view_update)

    def delete(self, saved_view_id: int) -> None:
        self.saved_view_repository.delete(self.get(saved_view_id))
