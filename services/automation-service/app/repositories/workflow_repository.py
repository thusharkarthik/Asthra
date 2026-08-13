from sqlalchemy.orm import Session

from app.models import Workflow


class WorkflowRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> Workflow:
        workflow = Workflow(**data)
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def list(
        self,
        workspace_id: int | None = None,
        status: str | None = None,
        created_by_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Workflow]:
        query = self.db.query(Workflow)
        if workspace_id is not None:
            query = query.filter(Workflow.workspace_id == workspace_id)
        if status is not None:
            query = query.filter(Workflow.status == status)
        if created_by_id is not None:
            query = query.filter(Workflow.created_by_id == created_by_id)
        return query.order_by(Workflow.id.desc()).offset(offset).limit(limit).all()

    def get(self, workflow_id: int) -> Workflow | None:
        return self.db.get(Workflow, workflow_id)

    def update(self, workflow: Workflow, data: dict) -> Workflow:
        for key, value in data.items():
            setattr(workflow, key, value)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow

    def delete(self, workflow: Workflow) -> None:
        self.db.delete(workflow)
        self.db.commit()
