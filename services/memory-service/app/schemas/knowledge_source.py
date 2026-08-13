from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class KnowledgeSourceCreate(BaseModel):
    workspace_id: int | None = None
    source_type: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    external_reference: str | None = Field(default=None, max_length=1000)


class KnowledgeSourceRead(TimestampedRead):
    workspace_id: int | None = None
    source_type: str
    name: str
    external_reference: str | None = None
