from app.schemas.schemas import EventSubscriptionCreate
from app.services.event_subscription_service import EventSubscriptionService


def test_create_list_update_delete_event_subscription(db):
    service = EventSubscriptionService(db)
    subscription = service.create(
        EventSubscriptionCreate(
            workspace_id=1,
            event_name="ticket.created",
            subscriber_type="webhook",
            subscriber_reference="support",
        ).model_dump()
    )

    assert len(service.list(workspace_id=1, event_name="ticket.created")) == 1
    assert service.update(subscription.id, {"is_active": False}).is_active is False
    service.delete(subscription.id)
    assert len(service.list(workspace_id=1)) == 0
