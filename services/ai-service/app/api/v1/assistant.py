from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantMessageCreate,
    AssistantMessageRead,
    AssistantSessionCreate,
    AssistantSessionRead,
)
from app.services.assistant_service import AssistantService

router = APIRouter()


@router.post("/sessions", response_model=AssistantSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(data: AssistantSessionCreate, db: Session = Depends(get_db)):
    return AssistantService(db).create_session(data)


@router.get("/sessions", response_model=list[AssistantSessionRead])
def list_sessions(
    workspace_id: int | None = Query(default=None),
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return AssistantService(db).list_sessions(workspace_id=workspace_id, user_id=user_id)


@router.get("/sessions/{session_id}", response_model=AssistantSessionRead)
def get_session(session_id: int, db: Session = Depends(get_db)):
    return AssistantService(db).get_session(session_id)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    AssistantService(db).delete_session(session_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/sessions/{session_id}/messages", response_model=AssistantMessageRead, status_code=status.HTTP_201_CREATED)
def create_message(session_id: int, data: AssistantMessageCreate, db: Session = Depends(get_db)):
    return AssistantService(db).create_message(session_id, data)


@router.get("/sessions/{session_id}/messages", response_model=list[AssistantMessageRead])
def list_messages(session_id: int, db: Session = Depends(get_db)):
    return AssistantService(db).list_messages(session_id)


@router.post("/chat", response_model=AssistantChatResponse)
def chat(data: AssistantChatRequest, db: Session = Depends(get_db)):
    return AssistantService(db).chat(data)
