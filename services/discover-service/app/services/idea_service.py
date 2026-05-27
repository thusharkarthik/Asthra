from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.idea import Idea
from app.repositories.idea_repository import IdeaRepository
from app.schemas.idea import IdeaCreate, IdeaUpdate


class IdeaService:
    def __init__(self, db: Session) -> None:
        self.repository = IdeaRepository(db)

    def create(self, data: IdeaCreate) -> Idea:
        return self.repository.create(data)

    def list(self, **filters) -> list[Idea]:
        return self.repository.list(**filters)

    def get(self, idea_id: int) -> Idea:
        idea = self.repository.get(idea_id)
        if idea is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found.")
        return idea

    def update(self, idea_id: int, data: IdeaUpdate) -> Idea:
        return self.repository.update(self.get(idea_id), data)

    def delete(self, idea_id: int) -> None:
        self.repository.delete(self.get(idea_id))

    # TODO: Add AI feasibility, competitor, MVP, and monetization analysis in later tiers.
