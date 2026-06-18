from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.saved_view import SavedView
from app.schemas.saved_view import SavedViewCreate, SavedViewUpdate


class SavedViewRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, saved_view_create: SavedViewCreate) -> SavedView:
        saved_view = SavedView(**saved_view_create.model_dump())
        self.db.add(saved_view)
        self.db.commit()
        self.db.refresh(saved_view)
        return saved_view

    def list(
        self,
        *,
        workspace_id: int | None = None,
        project_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[SavedView]:
        statement = select(SavedView)
        if workspace_id is not None:
            statement = statement.where(SavedView.workspace_id == workspace_id)
        if project_id is not None:
            statement = statement.where(SavedView.project_id == project_id)
        statement = statement.order_by(SavedView.is_default.desc(), SavedView.name).offset(offset).limit(limit)
        return list(self.db.scalars(statement).all())

    def get(self, saved_view_id: int) -> SavedView | None:
        return self.db.get(SavedView, saved_view_id)

    def update(self, saved_view: SavedView, saved_view_update: SavedViewUpdate) -> SavedView:
        for field, value in saved_view_update.model_dump(exclude_unset=True).items():
            setattr(saved_view, field, value)
        self.db.add(saved_view)
        self.db.commit()
        self.db.refresh(saved_view)
        return saved_view

    def delete(self, saved_view: SavedView) -> None:
        self.db.delete(saved_view)
        self.db.commit()
