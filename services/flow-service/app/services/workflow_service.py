from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.work_item_status import WorkItemStatus
from app.models.workflow import Workflow, WorkflowTransition
from app.repositories.workflow_repository import WorkflowRepository, normalize_key
from app.schemas.workflow import (
    WorkflowAssignProject,
    WorkflowCreate,
    WorkflowRead,
    WorkflowStatusCreate,
    WorkflowStatusRead,
    WorkflowStatusUpdate,
    WorkflowTransitionCreate,
    WorkflowTransitionRead,
    WorkflowUpdate,
)


WORKFLOW_TEMPLATES = {
    "engineering": {
        "name": "Engineering Workflow",
        "description": "Default engineering delivery workflow.",
        "statuses": [
            ("Todo", "todo", "backlog"),
            ("In Progress", "in_progress", "active"),
            ("Review", "review", "review"),
            ("Done", "done", "completed"),
        ],
        "transitions": [("todo", "in_progress"), ("in_progress", "review"), ("review", "done"), ("done", "todo")],
    },
    "product": {
        "name": "Product Workflow",
        "description": "Product discovery and release workflow.",
        "statuses": [
            ("Idea", "idea", "backlog"),
            ("Discovery", "discovery", "active"),
            ("Validation", "validation", "review"),
            ("Approved", "approved", "review"),
            ("Released", "released", "completed"),
        ],
        "transitions": [("idea", "discovery"), ("discovery", "validation"), ("validation", "approved"), ("approved", "released")],
    },
    "support": {
        "name": "Support Workflow",
        "description": "Support and service desk workflow.",
        "statuses": [
            ("Open", "open", "backlog"),
            ("Assigned", "assigned", "active"),
            ("Investigating", "investigating", "active"),
            ("Resolved", "resolved", "review"),
            ("Closed", "closed", "completed"),
        ],
        "transitions": [("open", "assigned"), ("assigned", "investigating"), ("investigating", "resolved"), ("resolved", "closed"), ("closed", "open")],
    },
}


class WorkflowService:
    def __init__(self, db: Session) -> None:
        self.workflow_repository = WorkflowRepository(db)

    def create(self, workflow_create: WorkflowCreate) -> WorkflowRead:
        workflow = self.workflow_repository.create(workflow_create)
        return self.to_read(workflow)

    def create_from_template(self, template: str, project_id: int | None = None, workspace_id: int | None = None) -> WorkflowRead:
        template_data = WORKFLOW_TEMPLATES.get(template)
        if template_data is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow template not found.")
        workflow = self.workflow_repository.create(
            WorkflowCreate(
                project_id=project_id,
                workspace_id=workspace_id,
                name=template_data["name"],
                description=template_data["description"],
                is_default=False,
            )
        )
        statuses = {}
        for index, (name, key, category) in enumerate(template_data["statuses"]):
            created = self.workflow_repository.create_status(workflow.id, WorkflowStatusCreate(name=name, key=key, category=category, sort_order=index))
            statuses[key] = created
        for from_key, to_key in template_data["transitions"]:
            self.workflow_repository.create_transition(workflow.id, WorkflowTransitionCreate(from_status_id=statuses[from_key].id, to_status_id=statuses[to_key].id))
        return self.to_read(self.get_model(workflow.id))

    def list(self, project_id: int | None = None, workspace_id: int | None = None) -> list[WorkflowRead]:
        workflows = self.workflow_repository.list(project_id=project_id, workspace_id=workspace_id)
        if not workflows and project_id is not None:
            return [self.ensure_project_workflow(project_id)]
        return [self.to_read(workflow) for workflow in workflows]

    def get(self, workflow_id: int) -> WorkflowRead:
        return self.to_read(self.get_model(workflow_id))

    def update(self, workflow_id: int, workflow_update: WorkflowUpdate) -> WorkflowRead:
        workflow = self.get_model(workflow_id)
        return self.to_read(self.workflow_repository.update(workflow, workflow_update))

    def delete(self, workflow_id: int) -> None:
        workflow = self.get_model(workflow_id)
        self.workflow_repository.delete(workflow)

    def assign_project(self, workflow_id: int, assignment: WorkflowAssignProject) -> WorkflowRead:
        workflow = self.get_model(workflow_id)
        return self.to_read(self.workflow_repository.update(workflow, WorkflowUpdate(project_id=assignment.project_id)))

    def add_status(self, workflow_id: int, status_create: WorkflowStatusCreate) -> WorkflowStatusRead:
        self.get_model(workflow_id)
        return WorkflowStatusRead.model_validate(self.workflow_repository.create_status(workflow_id, status_create))

    def update_status(self, workflow_id: int, status_id: int, status_update: WorkflowStatusUpdate) -> WorkflowStatusRead:
        self.get_model(workflow_id)
        workflow_status = self.get_status_model(workflow_id, status_id)
        return WorkflowStatusRead.model_validate(self.workflow_repository.update_status(workflow_status, status_update))

    def add_transition(self, workflow_id: int, transition_create: WorkflowTransitionCreate) -> WorkflowTransitionRead:
        self.get_model(workflow_id)
        self._validate_transition_statuses(workflow_id, transition_create.from_status_id, transition_create.to_status_id)
        return self.transition_to_read(self.workflow_repository.create_transition(workflow_id, transition_create))

    def ensure_project_workflow(self, project_id: int) -> WorkflowRead:
        existing = self.workflow_repository.get_for_project(project_id)
        if existing is not None:
            return self.to_read(self._ensure_default_statuses_and_transitions(existing))
        template_data = WORKFLOW_TEMPLATES["engineering"]
        workflow = self.workflow_repository.create(
            WorkflowCreate(project_id=project_id, name=template_data["name"], description=template_data["description"], is_default=True)
        )
        return self.to_read(self._ensure_default_statuses_and_transitions(workflow))

    def get_or_create_status_for_project(self, project_id: int, key_or_name: str | None = None) -> WorkItemStatus:
        workflow = self.ensure_project_workflow(project_id)
        lookup = key_or_name or "todo"
        workflow_status = self.workflow_repository.find_status(workflow.id, lookup)
        if workflow_status is None:
            workflow_status = self.workflow_repository.find_status(workflow.id, "todo")
        if workflow_status is None:
            workflow = self._ensure_default_statuses_and_transitions(self.get_model(workflow.id))
            workflow_status = self.workflow_repository.find_status(workflow.id, "todo")
        if workflow_status is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow status not found.")
        return workflow_status

    def validate_transition(self, project_id: int, from_status_id: int, to_status_id: int) -> None:
        if from_status_id == to_status_id:
            return
        workflow = self.get_model(self.ensure_project_workflow(project_id).id)
        workflow_status_ids = {workflow_status.id for workflow_status in workflow.statuses if workflow_status.is_active}
        if to_status_id not in workflow_status_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target status is not part of the project workflow.")

    def get_model(self, workflow_id: int) -> Workflow:
        workflow = self.workflow_repository.get(workflow_id)
        if workflow is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found.")
        return workflow

    def get_status_model(self, workflow_id: int, status_id: int) -> WorkItemStatus:
        workflow_status = self.workflow_repository.get_status(status_id)
        if workflow_status is None or workflow_status.workflow_id != workflow_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow status not found.")
        return workflow_status

    def _validate_transition_statuses(self, workflow_id: int, from_status_id: int, to_status_id: int) -> None:
        from_status = self.get_status_model(workflow_id, from_status_id)
        to_status = self.get_status_model(workflow_id, to_status_id)
        if from_status.id == to_status.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transition cannot target the same status.")

    def _ensure_default_statuses_and_transitions(self, workflow: Workflow) -> Workflow:
        template_data = WORKFLOW_TEMPLATES["engineering"]
        statuses = {}
        for index, (name, key, category) in enumerate(template_data["statuses"]):
            existing_status = self.workflow_repository.find_status(workflow.id, key)
            if existing_status is None:
                existing_status = self.workflow_repository.create_status(
                    workflow.id,
                    WorkflowStatusCreate(name=name, key=key, category=category, sort_order=index),
                )
            else:
                existing_status = self.workflow_repository.update_status(
                    existing_status,
                    WorkflowStatusUpdate(name=name, key=key, category=category, sort_order=index, is_active=True),
                )
            statuses[key] = existing_status
        for from_key, to_key in template_data["transitions"]:
            from_status = statuses[from_key]
            to_status = statuses[to_key]
            if not self.workflow_repository.transition_exists(workflow.id, from_status.id, to_status.id):
                self.workflow_repository.create_transition(
                    workflow.id,
                    WorkflowTransitionCreate(from_status_id=from_status.id, to_status_id=to_status.id),
                )
        return self.get_model(workflow.id)

    def to_read(self, workflow: Workflow) -> WorkflowRead:
        statuses = sorted(workflow.statuses, key=lambda workflow_status: workflow_status.sort_order)
        transitions = sorted(workflow.transitions, key=lambda transition: transition.id)
        return WorkflowRead(
            id=workflow.id,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at,
            project_id=workflow.project_id,
            workspace_id=workflow.workspace_id,
            name=workflow.name,
            description=workflow.description,
            is_default=workflow.is_default,
            statuses=[WorkflowStatusRead.model_validate(workflow_status) for workflow_status in statuses],
            transitions=[self.transition_to_read(transition) for transition in transitions],
        )

    def transition_to_read(self, transition: WorkflowTransition) -> WorkflowTransitionRead:
        return WorkflowTransitionRead(
            id=transition.id,
            created_at=transition.created_at,
            updated_at=transition.updated_at,
            workflow_id=transition.workflow_id,
            from_status_id=transition.from_status_id,
            to_status_id=transition.to_status_id,
            from_status_name=transition.from_status.name if transition.from_status else None,
            to_status_name=transition.to_status.name if transition.to_status else None,
        )


def workflow_template_names() -> list[str]:
    return sorted(WORKFLOW_TEMPLATES)
