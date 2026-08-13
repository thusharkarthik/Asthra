from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.idea import Idea
from app.repositories.idea_repository import IdeaRepository
from app.schemas.idea import IdeaCreate, IdeaMemoryDocumentPayload, IdeaUpdate


class IdeaService:
    def __init__(self, db: Session) -> None:
        self.repository = IdeaRepository(db)

    def create(self, data: IdeaCreate) -> Idea:
        return self.repository.create(self._normalize_payload(data))

    def list(self, **filters) -> list[Idea]:
        return self.repository.list(**filters)

    def get(self, idea_id: int) -> Idea:
        idea = self.repository.get(idea_id)
        if idea is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found.")
        return idea

    def update(self, idea_id: int, data: IdeaUpdate) -> Idea:
        return self.repository.update(self.get(idea_id), self._normalize_payload(data))

    def approve(self, idea_id: int) -> Idea:
        return self.update(idea_id, IdeaUpdate(status="approved"))

    def reject(self, idea_id: int) -> Idea:
        return self.update(idea_id, IdeaUpdate(status="rejected"))

    def mark_converted_to_work(self, idea_id: int) -> Idea:
        return self.update(idea_id, IdeaUpdate(status="converted_to_work"))

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
                "business_value": idea.business_value,
                "impact_score": idea.impact_score,
                "confidence_score": idea.confidence_score,
                "effort_score": idea.effort_score,
            },
        )

    def _normalize_payload(self, data: IdeaCreate | IdeaUpdate) -> IdeaCreate | IdeaUpdate:
        payload = data.model_dump(exclude_unset=True)
        if payload.get("problem") and not payload.get("problem_statement"):
            payload["problem_statement"] = payload["problem"]
        if payload.get("target_user") and not payload.get("target_users"):
            payload["target_users"] = payload["target_user"]
        payload.pop("problem", None)
        payload.pop("target_user", None)
        return data.__class__(**payload)

    # TODO: Add AI feasibility, competitor, MVP, and monetization analysis in later tiers.
