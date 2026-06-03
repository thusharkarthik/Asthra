from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.idea import Idea
from app.repositories.idea_repository import IdeaRepository
from app.schemas.idea import IdeaCreate, IdeaMemoryDocumentPayload, IdeaUpdate


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

    def prepare_memory_document(self, idea_id: int) -> IdeaMemoryDocumentPayload:
        idea = self.get(idea_id)
        return IdeaMemoryDocumentPayload(
            external_reference=f"idea:{idea.id}",
            workspace_id=idea.workspace_id,
            title=idea.title,
            content="\n\n".join(
                part
                for part in [
                    idea.description,
                    idea.problem_statement,
                    idea.target_users,
                ]
                if part
            ),
            metadata={
                "idea_id": idea.id,
                "project_id": idea.project_id,
                "status": idea.status,
                "created_by_id": idea.created_by_id,
            },
        )

    # TODO: Add AI feasibility, competitor, MVP, and monetization analysis in later tiers.
