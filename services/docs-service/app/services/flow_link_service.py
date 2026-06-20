from __future__ import annotations

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.doc_flow_link import DocFlowLink
from app.schemas.flow_link import PageFlowWorkItemCreate
from app.services.page_service import PageService


class FlowLinkService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_work_item_from_page(self, page_id: int, data: PageFlowWorkItemCreate) -> DocFlowLink:
        page = PageService(self.db).get(page_id)
        flow_base_url = self._required_service_url(settings.flow_service_url, "FLOW_SERVICE_URL")
        work_item_type = data.work_item_type
        item_level = "initiative" if work_item_type == "epic" else "work_item"
        title = data.title or self._default_work_item_title(work_item_type, page.title)
        existing = self.db.scalar(
            select(DocFlowLink).where(
                DocFlowLink.docs_page_id == page.id,
                DocFlowLink.flow_item_type == work_item_type,
                DocFlowLink.title == title,
            )
        )
        if existing is not None:
            return existing

        work_item = self._post_json(
            f"{flow_base_url}/api/v1/work-items",
            {
                "project_id": data.project_id,
                "title": title,
                "description": self._work_item_description(page),
                "item_level": item_level,
                "reporter_id": data.reporter_id,
            },
        )
        work_item_id = int(work_item["id"])
        self._post_json(
            f"{flow_base_url}/api/v1/work-items/{work_item_id}/links",
            {
                "entity_type": "doc_page",
                "entity_id": str(page.id),
                "entity_title": page.title,
                "entity_url": f"/docs/pages/{page.id}",
            },
            raise_on_error=False,
        )
        link = DocFlowLink(
            docs_page_id=page.id,
            flow_work_item_id=work_item_id,
            flow_item_type=work_item_type,
            title=work_item.get("title") or title,
            status=str(work_item.get("status_id") or "created"),
            assignee_id=work_item.get("assignee_id"),
            priority_id=work_item.get("priority_id"),
        )
        self.db.add(link)
        self.db.commit()
        self.db.refresh(link)
        return link

    def list_page_work_items(self, page_id: int) -> list[DocFlowLink]:
        PageService(self.db).get(page_id)
        return list(
            self.db.scalars(select(DocFlowLink).where(DocFlowLink.docs_page_id == page_id).order_by(DocFlowLink.id))
        )

    def _post_json(self, url: str, payload: dict, *, raise_on_error: bool = True) -> dict:
        try:
            response = httpx.post(url, json=payload, timeout=10.0)
            if raise_on_error:
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Flow service rejected request: {exc.response.text}",
            ) from exc
        except httpx.RequestError as exc:
            if not raise_on_error:
                return {}
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Flow service unavailable: {exc}") from exc
        if not response.content:
            return {}
        return response.json()

    def _required_service_url(self, value: str | None, env_name: str) -> str:
        if not value:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"{env_name} is not configured.")
        return value.rstrip("/")

    def _default_work_item_title(self, work_item_type: str, page_title: str) -> str:
        labels = {"epic": "Epic", "story": "Story", "task": "Task"}
        return f"{labels[work_item_type]}: {page_title}"

    def _work_item_description(self, page) -> str:
        return "\n\n".join(
            [
                f"Created from Docs page: {page.title}",
                f"Docs page ID: {page.id}",
                "## Source Content",
                page.content,
            ]
        )
