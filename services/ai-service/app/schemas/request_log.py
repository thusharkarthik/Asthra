from datetime import datetime

from pydantic import BaseModel, Field


class AIRequestLogCreate(BaseModel):
    provider_id: int
    model_name: str = Field(min_length=1, max_length=150)
    request_type: str = Field(min_length=1, max_length=100)
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    status: str = Field(min_length=1, max_length=50)
    latency_ms: int | None = None


class AIRequestLogRead(BaseModel):
    id: int
    provider_id: int
    model_name: str
    request_type: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    status: str
    latency_ms: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
