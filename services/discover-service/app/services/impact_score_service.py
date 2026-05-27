from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.impact_score import ImpactScore
from app.repositories.impact_score_repository import ImpactScoreRepository
from app.schemas.impact_score import ImpactScoreCreate
from app.services.idea_service import IdeaService


class ImpactScoreService:
    def __init__(self, db: Session) -> None:
        self.repository = ImpactScoreRepository(db)
        self.idea_service = IdeaService(db)

    def create_or_update(self, idea_id: int, data: ImpactScoreCreate) -> ImpactScore:
        self.idea_service.get(idea_id)
        total_score = self._calculate_total(data)
        return self.repository.create_or_update(
            idea_id=idea_id,
            impact=data.impact,
            effort=data.effort,
            confidence=data.confidence,
            reach=data.reach,
            total_score=total_score,
        )

    def get_by_idea(self, idea_id: int) -> ImpactScore:
        self.idea_service.get(idea_id)
        score = self.repository.get_by_idea(idea_id)
        if score is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Impact score not found.")
        return score

    def _calculate_total(self, data: ImpactScoreCreate) -> float:
        return round(data.impact + data.effort + data.confidence + data.reach, 2)
