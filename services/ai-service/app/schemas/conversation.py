from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class ConversationCreate(BaseModel):
    workspace_id: int | None = None
    user_id: int | None = None
    title: str | None = None


class ConversationRead(TimestampedRead):
    workspace_id: int | None = None
    user_id: int | None = None
    title: str | None = None


class ConversationMessageCreate(BaseModel):
    role: str = Field(min_length=1, max_length=50)
    content: str = Field(min_length=1)
    token_count: int | None = None


class ConversationMessageRead(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    token_count: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
