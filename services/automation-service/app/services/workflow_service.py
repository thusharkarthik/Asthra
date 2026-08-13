from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.workflow_repository import WorkflowRepository
from app.schemas.schemas import WORKFLOW_STATUSES


class WorkflowService:
    def __init__(self, db: Session):
        self.repository = WorkflowRepository(db)

    def create(self, data: dict):
        self._validate_required(data.get("workspace_id"), "workspace_id is required")
        self._validate_required(data.get("name"), "workflow name is required")
        self._validate_required(data.get("created_by_id"), "created_by_id is required")
        self._validate_status(data.get("status", "draft"))
        return self.repository.create(data)

    def list(self, workspace_id=None, status=None, created_by_id=None, limit=100, offset=0):
        if status is not None:
            self._validate_status(status)
        return self.repository.list(workspace_id, status, created_by_id, limit, offset)

    def get(self, workflow_id: int):
        workflow = self.repository.get(workflow_id)
        if not workflow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found.")
        return workflow

    def update(self, workflow_id: int, data: dict):
        workflow = self.get(workflow_id)
        if "status" in data:
            self._validate_status(data["status"])
        if data.get("name") == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="workflow name is required")
        return self.repository.update(workflow, data)

    def delete(self, workflow_id: int) -> None:
        self.repository.delete(self.get(workflow_id))

    @staticmethod
    def _validate_required(value, message: str) -> None:
        if value is None or value == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    @staticmethod
    def _validate_status(value: str) -> None:
        if value not in WORKFLOW_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="workflow status must be draft, active, paused, or archived",
            )
