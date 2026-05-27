from app.schemas.impact_score import ImpactScoreCreate
from app.services.impact_score_service import ImpactScoreService

from .conftest import create_idea


def test_create_and_get_impact_score(db):
    idea = create_idea(db)
    score = ImpactScoreService(db).create_or_update(
        idea.id,
        ImpactScoreCreate(impact=4, effort=2, confidence=3, reach=5),
    )

    assert score.total_score == 14
    fetched = ImpactScoreService(db).get_by_idea(idea.id)
    assert fetched.id == score.id
