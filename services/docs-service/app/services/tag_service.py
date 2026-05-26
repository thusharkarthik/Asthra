from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.page_tag import PageTag
from app.repositories.tag_repository import TagRepository
from app.schemas.tag import PageTagAssign, PageTagCreate


class TagService:
    def __init__(self, db: Session) -> None:
        self.tag_repository = TagRepository(db)

    def create(self, tag_create: PageTagCreate) -> PageTag:
        if self.tag_repository.get_by_name(tag_create.name):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tag already exists.",
            )
        return self.tag_repository.create(tag_create)

    def list(self) -> list[PageTag]:
        return self.tag_repository.list()

    def add_to_page(self, page_id: int, tag_assign: PageTagAssign) -> PageTag:
        page = self._get_active_page(page_id)
        tag = self.tag_repository.get_by_id(tag_assign.tag_id)
        if tag is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found.")
        if any(existing_tag.id == tag.id for existing_tag in page.tags):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tag is already attached to this page.",
            )
        return self.tag_repository.add_to_page(page, tag)

    def list_for_page(self, page_id: int) -> list[PageTag]:
        self._get_active_page(page_id)
        return self.tag_repository.list_for_page(page_id)

    def remove_from_page(self, page_id: int, tag_id: int) -> None:
        page = self._get_active_page(page_id)
        tag = self.tag_repository.get_by_id(tag_id)
        if tag is None or all(existing_tag.id != tag.id for existing_tag in page.tags):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page tag link not found.",
            )
        self.tag_repository.remove_from_page(page, tag)

    def _get_active_page(self, page_id: int):
        page = self.tag_repository.get_page(page_id)
        if page is None or not page.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found.")
        return page
