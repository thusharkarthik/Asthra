from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.document_chunk import DocumentChunkRead
from app.schemas.knowledge_document import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentRead,
    KnowledgeDocumentUpdate,
)
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("", response_model=KnowledgeDocumentRead, status_code=201)
def create_document(
    document_create: KnowledgeDocumentCreate,
    db: Session = Depends(get_db),
):
    return DocumentService(db).create(document_create)


@router.get("", response_model=list[KnowledgeDocumentRead])
def list_documents(
    source_id: int | None = Query(default=None),
    content_type: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return DocumentService(db).list(
        source_id=source_id,
        content_type=content_type,
        limit=limit,
        offset=offset,
    )


@router.get("/{document_id}", response_model=KnowledgeDocumentRead)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    return DocumentService(db).get(document_id)


@router.patch("/{document_id}", response_model=KnowledgeDocumentRead)
def update_document(
    document_id: int,
    document_update: KnowledgeDocumentUpdate,
    db: Session = Depends(get_db),
):
    return DocumentService(db).update(document_id, document_update)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    DocumentService(db).delete(document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{document_id}/chunks", response_model=list[DocumentChunkRead])
def list_document_chunks(
    document_id: int,
    db: Session = Depends(get_db),
):
    return DocumentService(db).list_chunks(document_id)
