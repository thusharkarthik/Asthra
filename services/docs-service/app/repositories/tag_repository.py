from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.page import Page
from app.models.page_tag import PageTag
from app.schemas.tag import PageTagCreate


class TagRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, tag_create: PageTagCreate) -> PageTag:
        tag = PageTag(name=tag_create.name.strip())
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def list(self) -> list[PageTag]:
        statement = select(PageTag).order_by(PageTag.name)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, tag_id: int) -> PageTag | None:
        return self.db.get(PageTag, tag_id)

    def get_page(self, page_id: int) -> Page | None:
        return self.db.get(Page, page_id)

    def get_by_name(self, name: str) -> PageTag | None:
        statement = select(PageTag).where(func.lower(PageTag.name) == name.strip().lower())
        return self.db.scalars(statement).first()

    def add_to_page(self, page: Page, tag: PageTag) -> PageTag:
        page.tags.append(tag)
        self.db.add(page)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def list_for_page(self, page_id: int) -> list[PageTag]:
        page = self.get_page(page_id)
        if page is None:
            return []
        return list(page.tags)

    def remove_from_page(self, page: Page, tag: PageTag) -> None:
        page.tags.remove(tag)
        self.db.add(page)
        self.db.commit()
