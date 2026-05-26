from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.page import Page
from app.models.page_comment import PageComment
from app.schemas.comment import PageCommentCreate, PageCommentUpdate


class CommentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_page(self, page_id: int) -> Page | None:
        return self.db.get(Page, page_id)

    def create(self, page_id: int, comment_create: PageCommentCreate) -> PageComment:
        comment = PageComment(page_id=page_id, **comment_create.model_dump())
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def list_for_page(self, page_id: int) -> list[PageComment]:
        statement = (
            select(PageComment)
            .where(PageComment.page_id == page_id)
            .order_by(PageComment.id)
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, comment_id: int) -> PageComment | None:
        return self.db.get(PageComment, comment_id)

    def update(self, comment: PageComment, comment_update: PageCommentUpdate) -> PageComment:
        comment.content = comment_update.content
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete(self, comment: PageComment) -> None:
        self.db.delete(comment)
        self.db.commit()
