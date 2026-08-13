from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
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
from app.services.workflow_service import WorkflowService, workflow_template_names

router = APIRouter()
project_router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post("", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
def create_workflow(workflow_create: WorkflowCreate, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> WorkflowRead:
    return WorkflowService(db).create(workflow_create)


@router.post("/templates/{template_name}", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
def create_workflow_from_template(
    template_name: str,
    project_id: int | None = None,
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkflowRead:
    return WorkflowService(db).create_from_template(template_name, project_id=project_id, workspace_id=workspace_id)


@router.get("/templates", response_model=list[str])
def list_workflow_templates(_: None = Depends(auth_placeholder)) -> list[str]:
    return workflow_template_names()


@router.get("", response_model=list[WorkflowRead])
def list_workflows(
    project_id: int | None = None,
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[WorkflowRead]:
    return WorkflowService(db).list(project_id=project_id, workspace_id=workspace_id)


@router.get("/{workflow_id}", response_model=WorkflowRead)
def get_workflow(workflow_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> WorkflowRead:
    return WorkflowService(db).get(workflow_id)


@router.patch("/{workflow_id}", response_model=WorkflowRead)
def update_workflow(workflow_id: int, workflow_update: WorkflowUpdate, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> WorkflowRead:
    return WorkflowService(db).update(workflow_id, workflow_update)


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(workflow_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> Response:
    WorkflowService(db).delete(workflow_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{workflow_id}/assign-project", response_model=WorkflowRead)
def assign_workflow_to_project(
    workflow_id: int,
    assignment: WorkflowAssignProject,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkflowRead:
    return WorkflowService(db).assign_project(workflow_id, assignment)


@router.post("/{workflow_id}/statuses", response_model=WorkflowStatusRead, status_code=status.HTTP_201_CREATED)
def create_workflow_status(
    workflow_id: int,
    status_create: WorkflowStatusCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkflowStatusRead:
    return WorkflowService(db).add_status(workflow_id, status_create)


@router.patch("/{workflow_id}/statuses/{status_id}", response_model=WorkflowStatusRead)
def update_workflow_status(
    workflow_id: int,
    status_id: int,
    status_update: WorkflowStatusUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkflowStatusRead:
    return WorkflowService(db).update_status(workflow_id, status_id, status_update)


@router.post("/{workflow_id}/transitions", response_model=WorkflowTransitionRead, status_code=status.HTTP_201_CREATED)
def create_workflow_transition(
    workflow_id: int,
    transition_create: WorkflowTransitionCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> WorkflowTransitionRead:
    return WorkflowService(db).add_transition(workflow_id, transition_create)


@project_router.get("/{project_id}/workflow", response_model=WorkflowRead)
def get_project_workflow(project_id: int, db: Session = Depends(get_db), _: None = Depends(auth_placeholder)) -> WorkflowRead:
    return WorkflowService(db).ensure_project_workflow(project_id)
