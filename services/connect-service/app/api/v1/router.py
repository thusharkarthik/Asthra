from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas.schemas import (
    APIConnectionCreate,
    APIConnectionRead,
    APIConnectionUpdate,
    ConnectorCreate,
    ConnectorRead,
    ConnectorUpdate,
    EventSubscriptionCreate,
    EventSubscriptionRead,
    EventSubscriptionUpdate,
    IntegrationCreate,
    IntegrationRead,
    IntegrationUpdate,
    SyncJobCreate,
    SyncJobRead,
    SyncJobUpdate,
    WebhookDeliveryRead,
    WebhookEndpointCreate,
    WebhookEndpointRead,
    WebhookEndpointUpdate,
)
from app.services.api_connection_service import APIConnectionService
from app.services.connector_service import ConnectorService
from app.services.event_subscription_service import EventSubscriptionService
from app.services.integration_service import IntegrationService
from app.services.sync_job_service import SyncJobService
from app.services.webhook_service import WebhookDeliveryService, WebhookEndpointService

api_router = APIRouter()


def _dump(schema, item):
    return schema.model_validate(item).model_dump(mode="json")


@api_router.post("/integrations", status_code=status.HTTP_201_CREATED)
def create_integration(payload: IntegrationCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(IntegrationRead, IntegrationService(db).create(payload.model_dump())))


@api_router.get("/integrations")
def list_integrations(workspace_id: int | None = None, provider: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = IntegrationService(db).list(workspace_id, provider, status, limit, offset)
    return success_response(data=[_dump(IntegrationRead, item) for item in items])


@api_router.get("/integrations/{integration_id}")
def get_integration(integration_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(IntegrationRead, IntegrationService(db).get(integration_id)))


@api_router.patch("/integrations/{integration_id}")
def update_integration(integration_id: int, payload: IntegrationUpdate, db: Session = Depends(get_db)):
    item = IntegrationService(db).update(integration_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(IntegrationRead, item))


@api_router.delete("/integrations/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_integration(integration_id: int, db: Session = Depends(get_db)):
    IntegrationService(db).delete(integration_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/connectors", status_code=status.HTTP_201_CREATED)
def create_connector(payload: ConnectorCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(ConnectorRead, ConnectorService(db).create(payload.model_dump())))


@api_router.get("/connectors")
def list_connectors(integration_id: int | None = None, connector_type: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = ConnectorService(db).list(integration_id, connector_type, status, limit, offset)
    return success_response(data=[_dump(ConnectorRead, item) for item in items])


@api_router.get("/connectors/{connector_id}")
def get_connector(connector_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(ConnectorRead, ConnectorService(db).get(connector_id)))


@api_router.patch("/connectors/{connector_id}")
def update_connector(connector_id: int, payload: ConnectorUpdate, db: Session = Depends(get_db)):
    return success_response(data=_dump(ConnectorRead, ConnectorService(db).update(connector_id, payload.model_dump(exclude_unset=True))))


@api_router.delete("/connectors/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connector(connector_id: int, db: Session = Depends(get_db)):
    ConnectorService(db).delete(connector_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/webhooks", status_code=status.HTTP_201_CREATED)
def create_webhook(payload: WebhookEndpointCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(WebhookEndpointRead, WebhookEndpointService(db).create(payload.model_dump())))


@api_router.get("/webhooks")
def list_webhooks(workspace_id: int | None = None, is_active: bool | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = WebhookEndpointService(db).list(workspace_id, is_active, limit, offset)
    return success_response(data=[_dump(WebhookEndpointRead, item) for item in items])


@api_router.get("/webhooks/{webhook_id}")
def get_webhook(webhook_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(WebhookEndpointRead, WebhookEndpointService(db).get(webhook_id)))


@api_router.patch("/webhooks/{webhook_id}")
def update_webhook(webhook_id: int, payload: WebhookEndpointUpdate, db: Session = Depends(get_db)):
    return success_response(data=_dump(WebhookEndpointRead, WebhookEndpointService(db).update(webhook_id, payload.model_dump(exclude_unset=True))))


@api_router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_webhook(webhook_id: int, db: Session = Depends(get_db)):
    WebhookEndpointService(db).delete(webhook_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.get("/webhook-deliveries")
def list_webhook_deliveries(event_type: str | None = None, delivery_status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = WebhookDeliveryService(db).list(event_type, delivery_status, limit, offset)
    return success_response(data=[_dump(WebhookDeliveryRead, item) for item in items])


@api_router.get("/webhook-deliveries/{delivery_id}")
def get_webhook_delivery(delivery_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(WebhookDeliveryRead, WebhookDeliveryService(db).get(delivery_id)))


@api_router.post("/event-subscriptions", status_code=status.HTTP_201_CREATED)
def create_event_subscription(payload: EventSubscriptionCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(EventSubscriptionRead, EventSubscriptionService(db).create(payload.model_dump())))


@api_router.get("/event-subscriptions")
def list_event_subscriptions(workspace_id: int | None = None, event_name: str | None = None, is_active: bool | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = EventSubscriptionService(db).list(workspace_id, event_name, is_active, limit, offset)
    return success_response(data=[_dump(EventSubscriptionRead, item) for item in items])


@api_router.patch("/event-subscriptions/{subscription_id}")
def update_event_subscription(subscription_id: int, payload: EventSubscriptionUpdate, db: Session = Depends(get_db)):
    item = EventSubscriptionService(db).update(subscription_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(EventSubscriptionRead, item))


@api_router.delete("/event-subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_subscription(subscription_id: int, db: Session = Depends(get_db)):
    EventSubscriptionService(db).delete(subscription_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.post("/sync-jobs", status_code=status.HTTP_201_CREATED)
def create_sync_job(payload: SyncJobCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(SyncJobRead, SyncJobService(db).create(payload.model_dump())))


@api_router.get("/sync-jobs")
def list_sync_jobs(integration_id: int | None = None, status: str | None = None, job_type: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = SyncJobService(db).list(integration_id, status, job_type, limit, offset)
    return success_response(data=[_dump(SyncJobRead, item) for item in items])


@api_router.get("/sync-jobs/{job_id}")
def get_sync_job(job_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(SyncJobRead, SyncJobService(db).get(job_id)))


@api_router.patch("/sync-jobs/{job_id}")
def update_sync_job(job_id: int, payload: SyncJobUpdate, db: Session = Depends(get_db)):
    return success_response(data=_dump(SyncJobRead, SyncJobService(db).update(job_id, payload.model_dump(exclude_unset=True))))


@api_router.post("/api-connections", status_code=status.HTTP_201_CREATED)
def create_api_connection(payload: APIConnectionCreate, db: Session = Depends(get_db)):
    return success_response(data=_dump(APIConnectionRead, APIConnectionService(db).create(payload.model_dump())))


@api_router.get("/api-connections")
def list_api_connections(workspace_id: int | None = None, provider: str | None = None, connection_status: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    items = APIConnectionService(db).list(workspace_id, provider, connection_status, limit, offset)
    return success_response(data=[_dump(APIConnectionRead, item) for item in items])


@api_router.get("/api-connections/{connection_id}")
def get_api_connection(connection_id: int, db: Session = Depends(get_db)):
    return success_response(data=_dump(APIConnectionRead, APIConnectionService(db).get(connection_id)))


@api_router.patch("/api-connections/{connection_id}")
def update_api_connection(connection_id: int, payload: APIConnectionUpdate, db: Session = Depends(get_db)):
    item = APIConnectionService(db).update(connection_id, payload.model_dump(exclude_unset=True))
    return success_response(data=_dump(APIConnectionRead, item))


@api_router.delete("/api-connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_connection(connection_id: int, db: Session = Depends(get_db)):
    APIConnectionService(db).delete(connection_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
