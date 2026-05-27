from sqlalchemy.orm import Session

from app.models.validation_note import ValidationNote
from app.repositories.validation_note_repository import ValidationNoteRepository
from app.schemas.validation_note import ValidationNoteCreate
from app.services.idea_service import IdeaService


class ValidationNoteService:
    def __init__(self, db: Session) -> None:
        self.repository = ValidationNoteRepository(db)
        self.idea_service = IdeaService(db)

    def create(self, idea_id: int, data: ValidationNoteCreate) -> ValidationNote:
        self.idea_service.get(idea_id)
        return self.repository.create(idea_id=idea_id, data=data)

    def list_by_idea(self, idea_id: int) -> list[ValidationNote]:
        self.idea_service.get(idea_id)
        return self.repository.list_by_idea(idea_id)
