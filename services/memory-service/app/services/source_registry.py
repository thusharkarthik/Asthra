from __future__ import annotations

from enum import StrEnum
from typing import Any

from fastapi import HTTPException, status
from pydantic import BaseModel, Field


class MemorySourceType(StrEnum):
    DOCS_PAGE = "docs_page"
    WORK_ITEM = "work_item"
    IDEA = "idea"
    FEATURE_REQUEST = "feature_request"
    SUPPORT_TICKET = "support_ticket"
    INCIDENT = "incident"
    RELEASE = "release"
    DISCUSSION_THREAD = "discussion_thread"


class SourceMetadata(BaseModel):
    source_type: MemorySourceType
    external_reference: str = Field(min_length=1)
    workspace_id: int
    title: str = Field(min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


SOURCE_OWNERS: dict[MemorySourceType, str] = {
    MemorySourceType.DOCS_PAGE: "docs-service",
    MemorySourceType.WORK_ITEM: "flow-service",
    MemorySourceType.IDEA: "discover-service",
    MemorySourceType.FEATURE_REQUEST: "discover-service",
    MemorySourceType.SUPPORT_TICKET: "desk-service",
    MemorySourceType.INCIDENT: "pulse-service",
    MemorySourceType.RELEASE: "dev-service",
    MemorySourceType.DISCUSSION_THREAD: "collab-service",
}


def normalize_source_type(source_type: str) -> MemorySourceType:
    try:
        return MemorySourceType(source_type.strip().lower())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported memory source_type: {source_type}.",
        ) from exc


def normalize_external_reference(source_type: MemorySourceType, external_reference: str) -> str:
    reference = external_reference.strip()
    if not reference:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="external_reference is required.")
    if ":" in reference:
        return reference
    return f"{source_type.value}:{reference}"


def normalize_source_metadata(
    *,
    source_type: str,
    external_reference: str,
    workspace_id: int,
    title: str,
    metadata: dict[str, Any] | None = None,
) -> SourceMetadata:
    normalized_type = normalize_source_type(source_type)
    return SourceMetadata(
        source_type=normalized_type,
        external_reference=normalize_external_reference(normalized_type, external_reference),
        workspace_id=workspace_id,
        title=title.strip(),
        metadata={
            **(metadata or {}),
            "source_owner": SOURCE_OWNERS[normalized_type],
        },
    )
