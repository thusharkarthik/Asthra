from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ingestion import MemoryIngestRequest, MemoryIngestResponse
from app.services.ingestion_service import IngestionService

router = APIRouter()


@router.post("", response_model=MemoryIngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_memory_document(data: MemoryIngestRequest, db: Session = Depends(get_db)):
    return IngestionService(db).ingest(data)
