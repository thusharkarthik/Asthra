from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.prompt_template import PromptTemplate
from app.schemas.prompt import PromptTemplateCreate, PromptTemplateRead, PromptTemplateUpdate
from app.services.prompt_service import PromptService

router = APIRouter()


@router.post("", response_model=PromptTemplateRead, status_code=status.HTTP_201_CREATED)
def create_prompt(
    prompt_create: PromptTemplateCreate,
    db: Session = Depends(get_db),
) -> PromptTemplate:
    return PromptService(db).create(prompt_create)


@router.get("", response_model=list[PromptTemplateRead])
def list_prompts(
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[PromptTemplate]:
    return PromptService(db).list(category=category)


@router.get("/{prompt_id}", response_model=PromptTemplateRead)
def get_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
) -> PromptTemplate:
    return PromptService(db).get(prompt_id)


@router.patch("/{prompt_id}", response_model=PromptTemplateRead)
def update_prompt(
    prompt_id: int,
    prompt_update: PromptTemplateUpdate,
    db: Session = Depends(get_db),
) -> PromptTemplate:
    return PromptService(db).update(prompt_id, prompt_update)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
) -> Response:
    PromptService(db).delete(prompt_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
