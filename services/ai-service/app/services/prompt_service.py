from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.prompt_template import PromptTemplate
from app.repositories.prompt_repository import PromptRepository
from app.schemas.prompt import PromptTemplateCreate, PromptTemplateUpdate


class PromptService:
    def __init__(self, db: Session) -> None:
        self.prompt_repository = PromptRepository(db)

    def create(self, prompt_create: PromptTemplateCreate) -> PromptTemplate:
        return self.prompt_repository.create(prompt_create)

    def list(self, *, category: str | None = None) -> list[PromptTemplate]:
        return self.prompt_repository.list(category=category)

    def get(self, prompt_id: int) -> PromptTemplate:
        prompt = self.prompt_repository.get_by_id(prompt_id)
        if prompt is None or not prompt.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found.")
        return prompt

    def update(
        self,
        prompt_id: int,
        prompt_update: PromptTemplateUpdate,
    ) -> PromptTemplate:
        prompt = self.get(prompt_id)
        return self.prompt_repository.update(prompt, prompt_update)

    def delete(self, prompt_id: int) -> None:
        prompt = self.get(prompt_id)
        self.prompt_repository.delete(prompt)
