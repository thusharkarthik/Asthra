from app.schemas.validation_note import ValidationNoteCreate
from app.services.validation_note_service import ValidationNoteService

from .conftest import create_idea


def test_create_and_list_validation_note(db):
    idea = create_idea(db)
    note = ValidationNoteService(db).create(
        idea.id,
        ValidationNoteCreate(
            note_type="interview",
            content="Users confirmed the problem is painful.",
            created_by_id=1,
        ),
    )

    notes = ValidationNoteService(db).list_by_idea(idea.id)
    assert [item.id for item in notes] == [note.id]
