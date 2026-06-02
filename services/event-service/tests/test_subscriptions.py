from app.schemas import EventRecordCreate, EventSubscriptionCreate, EventSubscriptionUpdate
from app.services.event_service import DeliveryLogService, EventService, SubscriptionService


def test_subscription_crud(db_session):
    service = SubscriptionService(db_session)
    created = service.create(
        EventSubscriptionCreate(
            subscriber_name="automation-service",
            event_pattern="core.*",
            target_type="internal_service",
            target_reference="automation-service",
        )
    )

    listed = service.list()
    updated = service.update(created.id, EventSubscriptionUpdate(is_active=False))
    service.delete(created.id)

    assert len(listed) == 1
    assert updated.is_active is False
    assert service.list() == []


def test_delivery_log_created_for_matching_subscription(db_session):
    SubscriptionService(db_session).create(
        EventSubscriptionCreate(
            subscriber_name="analytics",
            event_pattern="flow.*",
            target_type="internal_service",
            target_reference="insights-service",
        )
    )

    EventService(db_session).publish(
        EventRecordCreate(
            event_id="evt-flow-1",
            event_name="flow.work_item.created",
            source_service="flow-service",
            workspace_id=1,
            entity_type="work_item",
            entity_id="101",
            payload={"title": "Test"},
        )
    )

    logs = DeliveryLogService(db_session).list(delivery_status="pending")

    assert len(logs) == 1
    assert logs[0].delivery_status == "pending"
