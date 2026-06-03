from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.embedding_record import EmbeddingGenerationResponse, EmbeddingRecordRead
from app.services.embedding_service import EmbeddingService

router = APIRouter()


@router.post("/generate/{document_id}", response_model=EmbeddingGenerationResponse)
def generate_document_embeddings(
    document_id: int,
    db: Session = Depends(get_db),
):
    service = EmbeddingService(db)
    records, created_count, updated_count = service.generate_for_document(document_id)
    provider, model = service.provider_summary()
    return EmbeddingGenerationResponse(
        document_id=document_id,
        embedding_model=model,
        status="generated",
        chunks_processed=len(records),
        embeddings_created=created_count,
        provider=provider,
        model=model,
        records_created=created_count,
        records_updated=updated_count,
        records=records,
    )


@router.get("/document/{document_id}", response_model=list[EmbeddingRecordRead])
def list_document_embeddings(
    document_id: int,
    db: Session = Depends(get_db),
):
    return EmbeddingService(db).list_by_document(document_id)
