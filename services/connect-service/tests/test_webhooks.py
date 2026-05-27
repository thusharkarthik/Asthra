import pytest
from fastapi import HTTPException

from app.models import WebhookDelivery
from app.schemas.schemas import WebhookEndpointCreate
from app.services.webhook_service import WebhookDeliveryService, WebhookEndpointService
from tests.conftest import create_webhook


def test_create_list_get_update_delete_webhook_endpoint(db):
    service = WebhookEndpointService(db)
    webhook = service.create(
        WebhookEndpointCreate(
            workspace_id=1,
            name="Events",
            target_url="https://example.com/webhook",
        ).model_dump()
    )

    assert len(service.list(workspace_id=1)) == 1
    assert service.get(webhook.id).target_url == "https://example.com/webhook"
    assert service.update(webhook.id, {"is_active": False}).is_active is False
    service.delete(webhook.id)
    with pytest.raises(HTTPException):
        service.get(webhook.id)


def test_list_webhook_deliveries(db):
    webhook = create_webhook(db)
    delivery = WebhookDelivery(
        webhook_endpoint_id=webhook.id,
        event_type="work_item.created",
        payload={"id": 1},
        delivery_status="pending",
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    service = WebhookDeliveryService(db)
    assert len(service.list(event_type="work_item.created")) == 1
    assert service.get(delivery.id).delivery_status == "pending"
