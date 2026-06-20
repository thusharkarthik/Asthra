from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.execution import (
    CreateEpicRequest,
    DeliveryPipelineRead,
    DiscoverDocLinkRead,
    DiscoverFlowLinkRead,
    GenerateSpecificationRequest,
    IdeaExecutionLinksRead,
)
from app.services.execution_service import ExecutionService

router = APIRouter()


@router.post("/ideas/{idea_id}/generate-specification", response_model=DiscoverDocLinkRead, status_code=status.HTTP_201_CREATED)
def generate_idea_specification(idea_id: int, data: GenerateSpecificationRequest, db: Session = Depends(get_db)):
    return ExecutionService(db).generate_idea_specification(idea_id, data)


@router.post(
    "/feature-requests/{feature_request_id}/generate-specification",
    response_model=DiscoverDocLinkRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_feature_request_specification(
    feature_request_id: int,
    data: GenerateSpecificationRequest,
    db: Session = Depends(get_db),
):
    return ExecutionService(db).generate_feature_request_specification(feature_request_id, data)


@router.post("/ideas/{idea_id}/create-epic", response_model=DiscoverFlowLinkRead, status_code=status.HTTP_201_CREATED)
def create_idea_epic(idea_id: int, data: CreateEpicRequest, db: Session = Depends(get_db)):
    return ExecutionService(db).create_idea_epic(idea_id, data)


@router.get("/ideas/{idea_id}/execution-links", response_model=IdeaExecutionLinksRead)
def get_idea_execution_links(idea_id: int, db: Session = Depends(get_db)):
    documents, flow_work = ExecutionService(db).list_idea_execution_links(idea_id)
    return IdeaExecutionLinksRead(idea_id=idea_id, documents=documents, flow_work=flow_work)


@router.get("/delivery/pipeline", response_model=DeliveryPipelineRead)
def get_delivery_pipeline(
    workspace_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ExecutionService(db).delivery_pipeline(workspace_id=workspace_id, project_id=project_id)
