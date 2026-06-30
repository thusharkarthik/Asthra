from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AIContextScopeRead(BaseModel):
    organization_id: int | None = None
    workspace_id: int | None = None
    project_id: int | None = None
    scope_type: str
    scope_id: int | None = None


class AIContextBlockMetadataRead(BaseModel):
    key: str
    title: str
    description: str
    source_module: str
    category: str
    priority: int
    requires_feature_flag: str | None = None
    requires_permissions: list[str]


class AIContextBlockRead(AIContextBlockMetadataRead):
    scope_type: str
    scope_id: int | None = None
    data: dict[str, Any]
    metadata: dict[str, Any]
    generated_at: datetime


class AIContextSummaryRead(BaseModel):
    block_count: int
    source_modules: list[str]
    categories: list[str]


class AIContextResponse(BaseModel):
    generated_at: datetime
    scope: AIContextScopeRead
    summary: AIContextSummaryRead
    context_blocks: list[AIContextBlockRead]


class AIContextRegistryResponse(BaseModel):
    generated_at: datetime
    context_blocks: list[AIContextBlockMetadataRead]


class AIContextMetadataRead(BaseModel):
    available: bool
    endpoint: str
    block_count: int
    categories: list[str]
    source_modules: list[str]
