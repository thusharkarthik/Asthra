from sqlalchemy.orm import Session

from app.models.idea_ai_analysis import IdeaAIAnalysis
from app.schemas.idea import IdeaAIAnalysisRead
from app.services.ai_client import AIClient
from app.services.idea_service import IdeaService


class IdeaAIService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.idea_service = IdeaService(db)

    def analyze(self, idea_id: int, request_id: str | None = None) -> IdeaAIAnalysis:
        idea = self.idea_service.get(idea_id)
        prompt = (
            "Analyze this product idea and respond as JSON with keys: summary, problem_clarity, "
            "target_users, feasibility, risks, mvp_suggestion, monetization_angle, next_steps.\n\n"
            f"Title: {idea.title}\nDescription: {idea.description}\n"
            f"Problem: {idea.problem_statement or 'Not provided'}\n"
            f"Target users: {idea.target_users or 'Not provided'}"
        )
        result = AIClient().complete(
            prompt,
            system_prompt="You are a product strategy analyst. Return concise JSON only.",
            request_id=request_id,
        )
        analysis = IdeaAIAnalysis(
            idea_id=idea.id,
            summary=result.get("summary"),
            problem_clarity=result.get("problem_clarity"),
            target_users=result.get("target_users"),
            feasibility=result.get("feasibility"),
            risks=result.get("risks"),
            mvp_suggestion=result.get("mvp_suggestion"),
            monetization_angle=result.get("monetization_angle"),
            next_steps=result.get("next_steps"),
            raw_response=result.get("raw_response"),
        )
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis


def to_read_model(analysis: IdeaAIAnalysis) -> IdeaAIAnalysisRead:
    return IdeaAIAnalysisRead(
        idea_id=analysis.idea_id,
        summary=analysis.summary,
        problem_clarity=analysis.problem_clarity,
        target_users=analysis.target_users,
        feasibility=analysis.feasibility,
        risks=analysis.risks,
        mvp_suggestion=analysis.mvp_suggestion,
        monetization_angle=analysis.monetization_angle,
        next_steps=analysis.next_steps,
        raw_response=analysis.raw_response,
    )
