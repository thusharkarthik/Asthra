from datetime import datetime

from pydantic import BaseModel, Field, field_validator


ALLOWED_ENTITY_TYPES = {"idea", "doc_page", "work_item", "roadmap_item", "sprint", "release"}
ALLOWED_RELATIONSHIP_TYPES = {"documents", "executes", "roadmaps", "references", "originates_from", "ships_in"}


class LifecycleRelationshipCreate(BaseModel):
    source_type: str
    source_id: str
    target_type: str
    target_id: str
    relationship_type: str
    title: str | None = Field(default=None, max_length=255)
    label: str | None = Field(default=None, max_length=255)
    metadata_json: str | None = None

    @field_validator("source_type", "target_type")
    @classmethod
    def validate_entity_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_ENTITY_TYPES:
            raise ValueError(f"entity type must be one of: {', '.join(sorted(ALLOWED_ENTITY_TYPES))}")
        return normalized

    @field_validator("relationship_type")
    @classmethod
    def validate_relationship_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_RELATIONSHIP_TYPES:
            raise ValueError(f"relationship_type must be one of: {', '.join(sorted(ALLOWED_RELATIONSHIP_TYPES))}")
        return normalized

    @field_validator("source_id", "target_id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        normalized = str(value).strip()
        if not normalized:
            raise ValueError("id is required")
        return normalized


class LifecycleRelationshipRead(LifecycleRelationshipCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class LifecycleGraphRead(BaseModel):
    idea_id: str
    relationships: list[LifecycleRelationshipRead]
    documents: list[LifecycleRelationshipRead]
    work_items: list[LifecycleRelationshipRead]
    roadmap_items: list[LifecycleRelationshipRead]
    sprints: list[LifecycleRelationshipRead]
    releases: list[LifecycleRelationshipRead]
