from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.page import Page
from app.repositories.search_repository import SearchRepository


class SearchService:
    def __init__(self, db: Session) -> None:
        self.search_repository = SearchRepository(db)

    def search_pages(self, query: str, *, limit: int = 50, offset: int = 0) -> list[Page]:
        if not query or not query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Search query is required.",
            )
        return self.search_repository.search_pages(query.strip(), limit=limit, offset=offset)
