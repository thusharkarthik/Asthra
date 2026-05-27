from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.prompt_template import PromptTemplate
from app.schemas.prompt import PromptTemplateCreate, PromptTemplateUpdate


class PromptRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, prompt_create: PromptTemplateCreate) -> PromptTemplate:
        prompt = PromptTemplate(**prompt_create.model_dump())
        self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        return prompt

    def list(self, *, category: str | None = None) -> list[PromptTemplate]:
        statement = select(PromptTemplate).where(PromptTemplate.is_active.is_(True))
        if category is not None:
            statement = statement.where(PromptTemplate.category == category)
        statement = statement.order_by(PromptTemplate.id)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, prompt_id: int) -> PromptTemplate | None:
        return self.db.get(PromptTemplate, prompt_id)

    def update(
        self,
        prompt: PromptTemplate,
        prompt_update: PromptTemplateUpdate,
    ) -> PromptTemplate:
        update_data = prompt_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(prompt, field, value)
        self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        return prompt

    def delete(self, prompt: PromptTemplate) -> None:
        prompt.is_active = False
        self.db.add(prompt)
        self.db.commit()
