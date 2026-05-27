from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class PromptTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=100)
    system_prompt: str = Field(min_length=1)


class PromptTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    system_prompt: str | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class PromptTemplateRead(TimestampedRead):
    name: str
    category: str
    system_prompt: str
    is_active: bool
