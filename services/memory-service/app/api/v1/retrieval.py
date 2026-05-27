from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.retrieval_log import RetrievalSearchRequest, RetrievalSearchResponse
from app.services.retrieval_service import RetrievalService

router = APIRouter()


@router.post("/search", response_model=RetrievalSearchResponse)
def search_memory(
    search_request: RetrievalSearchRequest,
    db: Session = Depends(get_db),
):
    return RetrievalService(db).keyword_search(search_request)
