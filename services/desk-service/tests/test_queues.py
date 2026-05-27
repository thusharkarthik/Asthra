from app.schemas.queue import QueueCreate
from app.services.queue_service import QueueService


def test_create_and_list_queue(db):
    queue = QueueService(db).create(QueueCreate(workspace_id=1, name="Support"))
    queues = QueueService(db).list(workspace_id=1)
    assert [item.id for item in queues] == [queue.id]
