from datetime import datetime

from pydantic import BaseModel, Field


class AIProviderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    provider_type: str = Field(min_length=1, max_length=100)
    base_url: str | None = None
    model_name: str = Field(min_length=1, max_length=150)


class AIProviderRead(BaseModel):
    id: int
    name: str
    provider_type: str
    base_url: str | None = None
    model_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
