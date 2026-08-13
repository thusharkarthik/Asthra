from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AssistantSessionCreate(BaseModel):
    workspace_id: int
    user_id: int | None = None
    title: str | None = Field(default=None, max_length=255)


class AssistantSessionRead(BaseModel):
    id: int
    workspace_id: int
    user_id: int | None = None
    title: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssistantMessageCreate(BaseModel):
    role: str = Field(min_length=1, max_length=50)
    content: str = Field(min_length=1)
    metadata: dict[str, Any] | None = None


class AssistantMessageRead(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    metadata_: dict[str, Any] | None = Field(default=None, serialization_alias="metadata")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssistantContextRead(BaseModel):
    id: int
    session_id: int
    message_id: int | None = None
    source_type: str | None = None
    source_reference: str | None = None
    title: str | None = None
    content: str
    relevance_score: float | None = None
    metadata_: dict[str, Any] | None = Field(default=None, serialization_alias="metadata")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssistantToolCallRead(BaseModel):
    id: int
    session_id: int
    message_id: int | None = None
    tool_name: str
    status: str
    input_: dict[str, Any] | None = Field(default=None, serialization_alias="input")
    output_: dict[str, Any] | None = Field(default=None, serialization_alias="output")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssistantResponseRead(BaseModel):
    id: int
    session_id: int
    message_id: int | None = None
    answer: str
    provider: str | None = None
    model: str | None = None
    retrieval_metadata: dict[str, Any] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssistantChatRequest(BaseModel):
    workspace_id: int
    session_id: int | None = None
    message: str = Field(min_length=1)
    user_id: int | None = None
    provider: str | None = None
    model: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class AssistantSource(BaseModel):
    source_type: str | None = None
    source_reference: str | None = None
    title: str | None = None
    content: str
    relevance_score: float | None = None
    metadata: dict[str, Any] | None = None


class AssistantToolUsage(BaseModel):
    tool_name: str
    status: str
    input: dict[str, Any] | None = None
    output: dict[str, Any] | None = None


class AssistantChatResponse(BaseModel):
    session_id: int
    message_id: int
    response_id: int
    answer: str
    sources: list[AssistantSource]
    context_metadata: dict[str, Any]
    tool_usage: list[AssistantToolUsage]
    provider: str | None = None
    model: str | None = None
