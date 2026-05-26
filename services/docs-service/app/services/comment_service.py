from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.page_comment import PageComment
from app.repositories.comment_repository import CommentRepository
from app.schemas.comment import PageCommentCreate, PageCommentUpdate


class CommentService:
    def __init__(self, db: Session) -> None:
        self.comment_repository = CommentRepository(db)

    def create(self, page_id: int, comment_create: PageCommentCreate) -> PageComment:
        self._ensure_active_page(page_id)
        return self.comment_repository.create(page_id, comment_create)

    def list_for_page(self, page_id: int) -> list[PageComment]:
        self._ensure_active_page(page_id)
        return self.comment_repository.list_for_page(page_id)

    def update(self, comment_id: int, comment_update: PageCommentUpdate) -> PageComment:
        comment = self._get_comment(comment_id)
        return self.comment_repository.update(comment, comment_update)

    def delete(self, comment_id: int) -> None:
        comment = self._get_comment(comment_id)
        self.comment_repository.delete(comment)

    def _ensure_active_page(self, page_id: int) -> None:
        page = self.comment_repository.get_page(page_id)
        if page is None or not page.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found.")

    def _get_comment(self, comment_id: int) -> PageComment:
        comment = self.comment_repository.get_by_id(comment_id)
        if comment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        return comment
