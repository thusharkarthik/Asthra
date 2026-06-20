from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.page import Page
from app.models.page_version import PageVersion
from app.models.space import Space
from app.schemas.page import PageCreate, PageUpdate


class PageRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, page_create: PageCreate) -> Page:
        page = Page(**page_create.model_dump())
        self.db.add(page)
        self.db.commit()
        self.db.refresh(page)
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
        statement = select(Page).where(Page.is_active.is_(True))
        if space_id is not None:
            statement = statement.where(Page.space_id == space_id)
        if status is not None:
            statement = statement.where(Page.status == status)
        if created_by_id is not None:
            statement = statement.where(Page.created_by_id == created_by_id)
        if parent_page_id is not None:
            statement = statement.where(Page.parent_page_id == parent_page_id)
        statement = statement.order_by(Page.id).offset(offset).limit(limit)
        return list(self.db.scalars(statement).all())

    def list_for_space(self, space_id: int) -> list[Page]:
        statement = (
            select(Page)
            .where(Page.space_id == space_id, Page.is_active.is_(True))
            .order_by(Page.parent_page_id, Page.id)
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, page_id: int) -> Page | None:
        return self.db.get(Page, page_id)

    def get_space(self, space_id: int) -> Space | None:
        return self.db.get(Space, space_id)

    def update(self, page: Page, page_update: PageUpdate) -> Page:
        update_data = page_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(page, field, value)
        self.db.add(page)
        self.db.commit()
        self.db.refresh(page)
        return page

    def delete(self, page: Page) -> None:
        page.is_active = False
        self.db.add(page)
        self.db.commit()

    def create_version(self, page: Page, *, created_by_id: int, version_number: int) -> PageVersion:
        page_version = PageVersion(
            page_id=page.id,
            version_number=version_number,
            title=page.title,
            content=page.content,
            created_by_id=created_by_id,
        )
        self.db.add(page_version)
        self.db.commit()
        self.db.refresh(page_version)
        return page_version

    def next_version_number(self, page_id: int) -> int:
        statement = select(func.max(PageVersion.version_number)).where(PageVersion.page_id == page_id)
        current_version = self.db.scalar(statement)
        return int(current_version or 0) + 1

    def list_versions(self, page_id: int) -> list[PageVersion]:
        statement = select(PageVersion).where(PageVersion.page_id == page_id).order_by(PageVersion.version_number.desc())
        return list(self.db.scalars(statement).all())
