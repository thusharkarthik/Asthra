from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.api_connection_repository import APIConnectionRepository
from app.repositories.connector_repository import ConnectorRepository
from app.repositories.event_subscription_repository import EventSubscriptionRepository
from app.repositories.integration_repository import IntegrationRepository
from app.repositories.sync_job_repository import SyncJobRepository
from app.repositories.webhook_repository import WebhookDeliveryRepository, WebhookEndpointRepository


class BaseService:
    not_found_message = "Record not found."

    def _get_or_404(self, repository, item_id: int):
        item = repository.get(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=self.not_found_message)
        return item

    @staticmethod
    def _required(value, message: str) -> None:
        if value is None or value == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


class IntegrationService(BaseService):
    not_found_message = "Integration not found."

    def __init__(self, db: Session):
        self.repository = IntegrationRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("name"), "integration name is required")
        self._required(data.get("provider"), "provider is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, provider=None, status=None, limit=100, offset=0):
        return self.repository.list(workspace_id, provider, status, limit, offset)

    def get(self, integration_id: int):
        return self._get_or_404(self.repository, integration_id)

    def update(self, integration_id: int, data: dict):
        return self.repository.update(self.get(integration_id), data)

    def delete(self, integration_id: int) -> None:
        self.repository.delete(self.get(integration_id))


class ConnectorService(BaseService):
    not_found_message = "Connector not found."

    def __init__(self, db: Session):
        self.repository = ConnectorRepository(db)
        self.integration_service = IntegrationService(db)

    def create(self, data: dict):
        self.integration_service.get(data["integration_id"])
        self._required(data.get("connector_type"), "connector_type is required")
        self._required(data.get("connector_name"), "connector_name is required")
        return self.repository.create(data)

    def list(self, integration_id=None, connector_type=None, status=None, limit=100, offset=0):
        return self.repository.list(integration_id, connector_type, status, limit, offset)

    def get(self, connector_id: int):
        return self._get_or_404(self.repository, connector_id)

    def update(self, connector_id: int, data: dict):
        return self.repository.update(self.get(connector_id), data)

    def delete(self, connector_id: int) -> None:
        self.repository.delete(self.get(connector_id))


class WebhookEndpointService(BaseService):
    not_found_message = "Webhook endpoint not found."

    def __init__(self, db: Session):
        self.repository = WebhookEndpointRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("target_url"), "webhook target_url is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, is_active=None, limit=100, offset=0):
        return self.repository.list(workspace_id, is_active, limit, offset)

    def get(self, webhook_id: int):
        return self._get_or_404(self.repository, webhook_id)

    def update(self, webhook_id: int, data: dict):
        return self.repository.update(self.get(webhook_id), data)

    def delete(self, webhook_id: int) -> None:
        self.repository.delete(self.get(webhook_id))


class WebhookDeliveryService(BaseService):
    not_found_message = "Webhook delivery not found."

    def __init__(self, db: Session):
        self.repository = WebhookDeliveryRepository(db)

    def list(self, event_type=None, delivery_status=None, limit=100, offset=0):
        return self.repository.list(event_type, delivery_status, limit, offset)

    def get(self, delivery_id: int):
        return self._get_or_404(self.repository, delivery_id)


class EventSubscriptionService(BaseService):
    not_found_message = "Event subscription not found."

    def __init__(self, db: Session):
        self.repository = EventSubscriptionRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("event_name"), "event_name is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, event_name=None, is_active=None, limit=100, offset=0):
        return self.repository.list(workspace_id, event_name, is_active, limit, offset)

    def get(self, subscription_id: int):
        return self._get_or_404(self.repository, subscription_id)

    def update(self, subscription_id: int, data: dict):
        return self.repository.update(self.get(subscription_id), data)

    def delete(self, subscription_id: int) -> None:
        self.repository.delete(self.get(subscription_id))


class SyncJobService(BaseService):
    not_found_message = "Sync job not found."

    def __init__(self, db: Session):
        self.repository = SyncJobRepository(db)
        self.integration_service = IntegrationService(db)

    def create(self, data: dict):
        self.integration_service.get(data["integration_id"])
        self._required(data.get("job_type"), "job_type is required")
        return self.repository.create(data)

    def list(self, integration_id=None, status=None, job_type=None, limit=100, offset=0):
        return self.repository.list(integration_id, status, job_type, limit, offset)

    def get(self, job_id: int):
        return self._get_or_404(self.repository, job_id)

    def update(self, job_id: int, data: dict):
        return self.repository.update(self.get(job_id), data)


class APIConnectionService(BaseService):
    not_found_message = "API connection not found."

    def __init__(self, db: Session):
        self.repository = APIConnectionRepository(db)

    def create(self, data: dict):
        self._required(data.get("workspace_id"), "workspace_id is required")
        self._required(data.get("provider"), "provider is required")
        self._required(data.get("auth_type"), "auth_type is required")
        return self.repository.create(data)

    def list(self, workspace_id=None, provider=None, connection_status=None, limit=100, offset=0):
        return self.repository.list(workspace_id, provider, connection_status, limit, offset)

    def get(self, connection_id: int):
        return self._get_or_404(self.repository, connection_id)

    def update(self, connection_id: int, data: dict):
        return self.repository.update(self.get(connection_id), data)

    def delete(self, connection_id: int) -> None:
        self.repository.delete(self.get(connection_id))
