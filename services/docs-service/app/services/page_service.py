from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.page import Page
from app.repositories.page_repository import PageRepository
from app.schemas.page import PageCreate, PageMemoryDocumentPayload, PageUpdate
from app.services.event_publisher import publish_event


class PageService:
    def __init__(self, db: Session) -> None:
        self.page_repository = PageRepository(db)

    def create(self, page_create: PageCreate) -> Page:
        self._ensure_active_space(page_create.space_id)
        self._validate_parent(page_create.space_id, page_create.parent_page_id)
        page = self.page_repository.create(page_create)
        self.page_repository.create_version(
            page,
            created_by_id=page.created_by_id,
            version_number=1,
        )
        publish_event(
            "docs.page.created",
            payload={"title": page.title, "space_id": page.space_id, "status": page.status},
            actor_user_id=page.created_by_id,
            entity_type="page",
            entity_id=str(page.id),
        )
        return page

    def list(
        self,
        *,
        space_id: int | None = None,
        status: str | None = None,
        created_by_id: int | None = None,
        parent_page_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Page]:
        return self.page_repository.list(
            space_id=space_id,
            status=status,
            created_by_id=created_by_id,
            parent_page_id=parent_page_id,
            limit=limit,
            offset=offset,
        )

    def list_for_space(self, space_id: int) -> list[Page]:
        self._ensure_active_space(space_id)
        return self.page_repository.list_for_space(space_id)

    def get(self, page_id: int) -> Page:
        page = self.page_repository.get_by_id(page_id)
        if page is None or not page.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found.")
        return page

    def update(self, page_id: int, page_update: PageUpdate) -> Page:
        page = self.get(page_id)
        if page_update.parent_page_id is not None:
            self._validate_parent(page.space_id, page_update.parent_page_id, current_page_id=page.id)
        title_changed = page_update.title is not None and page_update.title != page.title
        content_changed = page_update.content is not None and page_update.content != page.content
        updated_page = self.page_repository.update(page, page_update)
        if title_changed or content_changed:
            self.page_repository.create_version(
                updated_page,
                created_by_id=page_update.updated_by_id or updated_page.created_by_id,
                version_number=self.page_repository.next_version_number(updated_page.id),
            )
        publish_event(
            "docs.page.updated",
            payload={
                "title": updated_page.title,
                "space_id": updated_page.space_id,
                "updated_fields": list(page_update.model_dump(exclude_unset=True)),
            },
            actor_user_id=page_update.updated_by_id or updated_page.created_by_id,
            entity_type="page",
            entity_id=str(updated_page.id),
        )
        return updated_page

    def delete(self, page_id: int) -> None:
        page = self.get(page_id)
        self.page_repository.delete(page)

    def prepare_memory_document(self, page_id: int) -> PageMemoryDocumentPayload:
        page = self.get(page_id)
        # TODO: Later this can optionally call memory-service ingestion. For now it only normalizes payload.
        return PageMemoryDocumentPayload(
            title=page.title,
            content=page.content,
            workspace_id=page.space.workspace_id,
            external_reference=f"page:{page.id}",
            metadata={
                "page_id": page.id,
                "space_id": page.space_id,
                "status": page.status,
                "created_by_id": page.created_by_id,
                "updated_by_id": page.updated_by_id,
            },
        )

    def _ensure_active_space(self, space_id: int) -> None:
        if space_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="space_id is required.",
            )
        space = self.page_repository.get_space(space_id)
        if space is None or not space.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found.")

    def _validate_parent(
        self,
        space_id: int,
        parent_page_id: int | None,
        *,
        current_page_id: int | None = None,
    ) -> None:
        if parent_page_id is None:
            return
        if current_page_id is not None and parent_page_id == current_page_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A page cannot be its own parent.",
            )
        parent_page = self.page_repository.get_by_id(parent_page_id)
        if parent_page is None or not parent_page.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent page not found.",
            )
        if parent_page.space_id != space_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent page must belong to the same space.",
            )
