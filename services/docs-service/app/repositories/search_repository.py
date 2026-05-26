from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.page import Page


class SearchRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def search_pages(self, query: str, *, limit: int = 50, offset: int = 0) -> list[Page]:
        pattern = f"%{query}%"
        statement = (
            select(Page)
            .where(
                Page.is_active.is_(True),
                or_(Page.title.ilike(pattern), Page.content.ilike(pattern)),
            )
            .order_by(Page.id)
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())
