from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.space import Space
from app.schemas.space import SpaceCreate, SpaceUpdate


class SpaceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, space_create: SpaceCreate) -> Space:
        space = Space(**space_create.model_dump())
        self.db.add(space)
        self.db.commit()
        self.db.refresh(space)
        return space

    def list(self, *, workspace_id: int | None = None) -> list[Space]:
        statement = select(Space).where(Space.is_active.is_(True))
        if workspace_id is not None:
            statement = statement.where(Space.workspace_id == workspace_id)
        statement = statement.order_by(Space.id)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, space_id: int) -> Space | None:
        return self.db.get(Space, space_id)

    def update(self, space: Space, space_update: SpaceUpdate) -> Space:
        update_data = space_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(space, field, value)
        self.db.add(space)
        self.db.commit()
        self.db.refresh(space)
        return space

    def delete(self, space: Space) -> None:
        space.is_active = False
        self.db.add(space)
        self.db.commit()
