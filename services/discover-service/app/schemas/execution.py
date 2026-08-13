from datetime import datetime

from pydantic import BaseModel, Field


class GenerateSpecificationRequest(BaseModel):
    space_id: int
    created_by_id: int
    title: str | None = Field(default=None, max_length=255)
    status: str = "draft"


class CreateEpicRequest(BaseModel):
    project_id: int | None = None
    reporter_id: int | None = None
    title: str | None = Field(default=None, max_length=255)


class DiscoverDocLinkRead(BaseModel):
    id: int
    source_type: str
    source_id: int
    docs_page_id: int
    title: str
    status: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DiscoverFlowLinkRead(BaseModel):
    id: int
    idea_id: int
    flow_work_item_id: int
    flow_item_type: str
    title: str
    status: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class IdeaExecutionLinksRead(BaseModel):
    idea_id: int
    documents: list[DiscoverDocLinkRead]
    flow_work: list[DiscoverFlowLinkRead]


class DeliveryPipelineRead(BaseModel):
    ideas: list[dict]
    specifications: list[dict]
    epics: list[dict]
    stories: list[dict]
    tasks: list[dict]
    completed: list[dict]
    counts: dict[str, int]
