from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.completion import ChatCompletionRequest, ChatCompletionResponse
from app.services.provider_service import ProviderService

router = APIRouter()


@router.post("/chat", response_model=ChatCompletionResponse)
def create_chat_completion(
    completion_request: ChatCompletionRequest,
    db: Session = Depends(get_db),
) -> ChatCompletionResponse:
    return ProviderService(db).generate_chat_completion(completion_request)
