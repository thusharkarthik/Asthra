from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.mvp_plan import MVPPlan
from app.schemas.mvp_plan import MVPPlanCreate, MVPPlanUpdate


class MVPPlanRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, idea_id: int, data: MVPPlanCreate) -> MVPPlan:
        item = MVPPlan(idea_id=idea_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get_by_idea(self, idea_id: int) -> MVPPlan | None:
        return self.db.scalars(select(MVPPlan).where(MVPPlan.idea_id == idea_id)).first()

    def update(self, item: MVPPlan, data: MVPPlanUpdate) -> MVPPlan:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
