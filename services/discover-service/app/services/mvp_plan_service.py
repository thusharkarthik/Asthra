from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.mvp_plan import MVPPlan
from app.repositories.mvp_plan_repository import MVPPlanRepository
from app.schemas.mvp_plan import MVPPlanCreate, MVPPlanUpdate
from app.services.idea_service import IdeaService


class MVPPlanService:
    def __init__(self, db: Session) -> None:
        self.repository = MVPPlanRepository(db)
        self.idea_service = IdeaService(db)

    def create(self, idea_id: int, data: MVPPlanCreate) -> MVPPlan:
        self.idea_service.get(idea_id)
        if self.repository.get_by_idea(idea_id) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MVP plan already exists for this idea.")
        return self.repository.create(idea_id=idea_id, data=data)

    def get_by_idea(self, idea_id: int) -> MVPPlan:
        self.idea_service.get(idea_id)
        plan = self.repository.get_by_idea(idea_id)
        if plan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MVP plan not found.")
        return plan

    def update(self, idea_id: int, data: MVPPlanUpdate) -> MVPPlan:
        return self.repository.update(self.get_by_idea(idea_id), data)

    # TODO: Add AI MVP planner and monetization analysis in later tiers.
