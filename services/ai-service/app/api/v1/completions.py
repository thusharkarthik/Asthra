from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.completion import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    RAGCompletionRequest,
    RAGCompletionResponse,
)
from app.services.provider_service import ProviderService
from app.services.rag_service import RAGService

router = APIRouter()


@router.post("/chat", response_model=ChatCompletionResponse)
def create_chat_completion(
    completion_request: ChatCompletionRequest,
    db: Session = Depends(get_db),
) -> ChatCompletionResponse:
    return ProviderService(db).generate_chat_completion(completion_request)


@router.post("/rag", response_model=RAGCompletionResponse)
def create_rag_completion(
    rag_request: RAGCompletionRequest,
    db: Session = Depends(get_db),
) -> RAGCompletionResponse:
    return RAGService(db).generate_rag_completion(rag_request)
