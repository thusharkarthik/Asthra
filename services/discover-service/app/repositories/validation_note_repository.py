from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.validation_note import ValidationNote
from app.schemas.validation_note import ValidationNoteCreate


class ValidationNoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, idea_id: int, data: ValidationNoteCreate) -> ValidationNote:
        item = ValidationNote(idea_id=idea_id, **data.model_dump())
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def list_by_idea(self, idea_id: int) -> list[ValidationNote]:
        stmt = select(ValidationNote).where(ValidationNote.idea_id == idea_id).order_by(ValidationNote.id)
        return list(self.db.scalars(stmt).all())
