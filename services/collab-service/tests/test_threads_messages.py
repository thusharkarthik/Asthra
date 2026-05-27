import pytest
from fastapi import HTTPException
from app.schemas.schemas import MessageCreate, MessageUpdate, ThreadUpdate
from app.services.services import MessageService, ThreadService
from .conftest import create_thread

def test_thread_and_message_crud(db):
    thread = create_thread(db)
    assert ThreadService(db).list(workspace_id=1, project_id=1, entity_type="task", entity_id=1, created_by_id=1, limit=10, offset=0)[0].id == thread.id
    assert ThreadService(db).get(thread.id).title == "Thread"
    assert ThreadService(db).update(thread.id, ThreadUpdate(status="closed")).status == "closed"
    msg = MessageService(db).create(thread.id, MessageCreate(author_id=1, content="Hello"))
    assert MessageService(db).list(thread.id)[0].id == msg.id
    assert MessageService(db).update(msg.id, MessageUpdate(content="Updated")).content == "Updated"
    MessageService(db).delete(msg.id)
    with pytest.raises(HTTPException): MessageService(db).get(msg.id)
    ThreadService(db).delete(thread.id)
    with pytest.raises(HTTPException): ThreadService(db).get(thread.id)
