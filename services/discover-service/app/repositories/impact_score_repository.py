from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.impact_score import ImpactScore


class ImpactScoreRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_or_update(self, *, idea_id: int, impact: float, effort: float, confidence: float, reach: float, total_score: float) -> ImpactScore:
        item = self.get_by_idea(idea_id)
        if item is None:
            item = ImpactScore(idea_id=idea_id)
        item.impact = impact
        item.effort = effort
        item.confidence = confidence
        item.reach = reach
        item.total_score = total_score
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get_by_idea(self, idea_id: int) -> ImpactScore | None:
        return self.db.scalars(select(ImpactScore).where(ImpactScore.idea_id == idea_id)).first()
