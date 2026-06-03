from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.workspace_search import WorkspaceSearchRequest, WorkspaceSearchResponse
from app.services.retrieval_service import RetrievalService

router = APIRouter()


@router.post("", response_model=WorkspaceSearchResponse)
def workspace_search(data: WorkspaceSearchRequest, db: Session = Depends(get_db)):
    return RetrievalService(db).workspace_search(data)
