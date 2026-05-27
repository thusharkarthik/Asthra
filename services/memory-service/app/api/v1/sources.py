from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.knowledge_source import KnowledgeSourceCreate, KnowledgeSourceRead
from app.services.source_service import SourceService

router = APIRouter()


@router.post("", response_model=KnowledgeSourceRead, status_code=201)
def create_source(
    source_create: KnowledgeSourceCreate,
    db: Session = Depends(get_db),
):
    return SourceService(db).create(source_create)


@router.get("", response_model=list[KnowledgeSourceRead])
def list_sources(
    workspace_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return SourceService(db).list(workspace_id=workspace_id)


@router.get("/{source_id}", response_model=KnowledgeSourceRead)
def get_source(
    source_id: int,
    db: Session = Depends(get_db),
):
    return SourceService(db).get(source_id)
