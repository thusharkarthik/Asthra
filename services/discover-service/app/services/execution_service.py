from __future__ import annotations

import json

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.discover_doc_link import DiscoverDocLink
from app.models.discover_flow_link import DiscoverFlowLink
from app.models.feature_request import FeatureRequest
from app.models.idea import Idea
from app.models.lifecycle_relationship import LifecycleRelationship
from app.schemas.execution import CreateEpicRequest, GenerateSpecificationRequest
from app.services.feature_request_service import FeatureRequestService
from app.services.idea_service import IdeaService


class ExecutionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def generate_idea_specification(self, idea_id: int, data: GenerateSpecificationRequest) -> DiscoverDocLink:
        idea = IdeaService(self.db).get(idea_id)
        return self._generate_specification_for_source(
            source_type="idea",
            source_id=idea.id,
            title=data.title or f"{idea.title} Specification",
            content=self._idea_spec_content(idea),
            created_by_id=data.created_by_id,
            space_id=data.space_id,
            status_value=data.status,
            on_created=lambda page_id: self._set_idea_doc_link(idea, page_id),
        )

    def generate_feature_request_specification(
        self,
        feature_request_id: int,
        data: GenerateSpecificationRequest,
    ) -> DiscoverDocLink:
        feature_request = FeatureRequestService(self.db).get(feature_request_id)
        return self._generate_specification_for_source(
            source_type="feature_request",
            source_id=feature_request.id,
            title=data.title or f"{feature_request.title} Specification",
            content=self._feature_request_spec_content(feature_request),
            created_by_id=data.created_by_id,
            space_id=data.space_id,
            status_value=data.status,
            on_created=None,
        )

    def create_idea_epic(self, idea_id: int, data: CreateEpicRequest) -> DiscoverFlowLink:
        idea = IdeaService(self.db).get(idea_id)
        existing = self.db.scalar(
            select(DiscoverFlowLink).where(
                DiscoverFlowLink.idea_id == idea.id,
                DiscoverFlowLink.flow_item_type == "epic",
            )
        )
        if existing is not None:
            return existing

        project_id = data.project_id or idea.project_id
        if project_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="project_id is required to create a Flow epic.")
        flow_base_url = self._required_service_url(settings.flow_service_url, "FLOW_SERVICE_URL")
        work_item = self._post_json(
            f"{flow_base_url}/api/v1/work-items",
            {
                "project_id": project_id,
                "title": data.title or idea.title,
                "description": self._idea_spec_content(idea),
                "item_level": "initiative",
                "reporter_id": data.reporter_id,
            },
        )
        work_item_id = int(work_item["id"])
        self._post_json(
            f"{flow_base_url}/api/v1/work-items/{work_item_id}/links",
            {
                "entity_type": "discover_idea",
                "entity_id": str(idea.id),
                "entity_title": idea.title,
                "entity_url": f"/discover/ideas/{idea.id}",
            },
            raise_on_error=False,
        )
        link = DiscoverFlowLink(
            idea_id=idea.id,
            flow_work_item_id=work_item_id,
            flow_item_type="epic",
            title=work_item.get("title") or idea.title,
            status=str(work_item.get("status_id") or "created"),
        )
        self.db.add(link)
        idea.flow_epic_id = work_item_id
        idea.status = "converted_to_work"
        self.db.add(idea)
        self._upsert_lifecycle_relationship(
            source_type="idea",
            source_id=str(idea.id),
            target_type="work_item",
            target_id=str(work_item_id),
            relationship_type="executes",
            title=link.title,
            label="Epic",
            metadata={"flow_item_type": "epic"},
        )
        self.db.commit()
        self.db.refresh(link)
        return link

    def list_idea_execution_links(self, idea_id: int) -> tuple[list[DiscoverDocLink], list[DiscoverFlowLink]]:
        IdeaService(self.db).get(idea_id)
        documents = list(
            self.db.scalars(
                select(DiscoverDocLink)
                .where(DiscoverDocLink.source_type == "idea", DiscoverDocLink.source_id == idea_id)
                .order_by(DiscoverDocLink.id)
            )
        )
        flow_work = list(
            self.db.scalars(select(DiscoverFlowLink).where(DiscoverFlowLink.idea_id == idea_id).order_by(DiscoverFlowLink.id))
        )
        return documents, flow_work

    def delivery_pipeline(self, *, workspace_id: int | None = None, project_id: int | None = None) -> dict:
        idea_statement = select(Idea).order_by(Idea.id)
        if workspace_id is not None:
            idea_statement = idea_statement.where(Idea.workspace_id == workspace_id)
        if project_id is not None:
            idea_statement = idea_statement.where(Idea.project_id == project_id)
        ideas = list(self.db.scalars(idea_statement))
        idea_ids = [idea.id for idea in ideas]
        doc_links = list(
            self.db.scalars(
                select(DiscoverDocLink).where(DiscoverDocLink.source_type == "idea", DiscoverDocLink.source_id.in_(idea_ids))
            )
        ) if idea_ids else []
        flow_links = list(self.db.scalars(select(DiscoverFlowLink).where(DiscoverFlowLink.idea_id.in_(idea_ids)))) if idea_ids else []
        epics = [link for link in flow_links if link.flow_item_type == "epic"]
        stories = [link for link in flow_links if link.flow_item_type == "story"]
        tasks = [link for link in flow_links if link.flow_item_type == "task"]
        completed = [idea for idea in ideas if idea.status in {"released", "completed", "converted_to_work"} and idea.flow_epic_id]
        return {
            "ideas": [self._idea_node(idea) for idea in ideas],
            "specifications": [self._doc_node(link) for link in doc_links],
            "epics": [self._flow_node(link) for link in epics],
            "stories": [self._flow_node(link) for link in stories],
            "tasks": [self._flow_node(link) for link in tasks],
            "completed": [self._idea_node(idea) for idea in completed],
            "counts": {
                "ideas": len(ideas),
                "specifications": len(doc_links),
                "epics": len(epics),
                "stories": len(stories),
                "tasks": len(tasks),
                "completed": len(completed),
            },
        }

    def _generate_specification_for_source(
        self,
        *,
        source_type: str,
        source_id: int,
        title: str,
        content: str,
        created_by_id: int,
        space_id: int,
        status_value: str,
        on_created,
    ) -> DiscoverDocLink:
        existing = self.db.scalar(
            select(DiscoverDocLink).where(DiscoverDocLink.source_type == source_type, DiscoverDocLink.source_id == source_id)
        )
        if existing is not None:
            return existing
        docs_base_url = self._required_service_url(settings.docs_service_url, "DOCS_SERVICE_URL")
        page = self._post_json(
            f"{docs_base_url}/api/v1/pages",
            {
                "space_id": space_id,
                "title": title,
                "content": content,
                "status": status_value,
                "created_by_id": created_by_id,
                "discover_idea_id": source_id if source_type == "idea" else None,
            },
        )
        page_id = int(page["id"])
        link = DiscoverDocLink(
            source_type=source_type,
            source_id=source_id,
            docs_page_id=page_id,
            title=page.get("title") or title,
            status=page.get("status"),
        )
        self.db.add(link)
        if on_created is not None:
            on_created(page_id)
        if source_type == "idea":
            self._upsert_lifecycle_relationship(
                source_type="idea",
                source_id=str(source_id),
                target_type="doc_page",
                target_id=str(page_id),
                relationship_type="documents",
                title=link.title,
                label="Specification",
                metadata={"source_type": source_type},
            )
        self.db.commit()
        self.db.refresh(link)
        return link

    def _set_idea_doc_link(self, idea: Idea, page_id: int) -> None:
        idea.docs_page_id = page_id
        self.db.add(idea)

    def _upsert_lifecycle_relationship(
        self,
        *,
        source_type: str,
        source_id: str,
        target_type: str,
        target_id: str,
        relationship_type: str,
        title: str,
        label: str,
        metadata: dict,
    ) -> None:
        existing = self.db.scalar(
            select(LifecycleRelationship).where(
                LifecycleRelationship.source_type == source_type,
                LifecycleRelationship.source_id == source_id,
                LifecycleRelationship.target_type == target_type,
                LifecycleRelationship.target_id == target_id,
                LifecycleRelationship.relationship_type == relationship_type,
            )
        )
        if existing is not None:
            return
        self.db.add(
            LifecycleRelationship(
                source_type=source_type,
                source_id=source_id,
                target_type=target_type,
                target_id=target_id,
                relationship_type=relationship_type,
                title=title,
                label=label,
                metadata_json=json.dumps(metadata),
            )
        )

    def _post_json(self, url: str, payload: dict, *, raise_on_error: bool = True) -> dict:
        try:
            response = httpx.post(url, json=payload, timeout=10.0)
            if raise_on_error:
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Downstream service rejected request: {exc.response.text}",
            ) from exc
        except httpx.RequestError as exc:
            if not raise_on_error:
                return {}
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Downstream service unavailable: {exc}") from exc
        if not response.content:
            return {}
        return response.json()

    def _required_service_url(self, value: str | None, env_name: str) -> str:
        if not value:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"{env_name} is not configured.")
        return value.rstrip("/")

    def _idea_spec_content(self, idea: Idea) -> str:
        return "\n\n".join([
            f"# {idea.title}",
            "## Overview",
            idea.description or "",
            "## Problem",
            idea.problem_statement or "Not documented yet.",
            "## Target Users",
            idea.target_users or "Not documented yet.",
            "## Business Value",
            idea.business_value or "Not documented yet.",
        ])

    def _feature_request_spec_content(self, feature_request: FeatureRequest) -> str:
        return "\n\n".join([
            f"# {feature_request.title}",
            "## Request",
            feature_request.description,
            "## Source",
            feature_request.source or "Not documented.",
            "## Requested By",
            feature_request.requested_by or "Not documented.",
        ])

    def _idea_node(self, idea: Idea) -> dict:
        return {"id": idea.id, "title": idea.title, "status": idea.status, "docs_page_id": idea.docs_page_id, "flow_epic_id": idea.flow_epic_id}

    def _doc_node(self, link: DiscoverDocLink) -> dict:
        return {"id": link.docs_page_id, "source_id": link.source_id, "title": link.title, "status": link.status}

    def _flow_node(self, link: DiscoverFlowLink) -> dict:
        return {"id": link.flow_work_item_id, "idea_id": link.idea_id, "title": link.title, "status": link.status, "type": link.flow_item_type}
