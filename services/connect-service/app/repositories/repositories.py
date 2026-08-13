from sqlalchemy.orm import Session

from app.models import APIConnection, Connector, EventSubscription, Integration, SyncJob, WebhookDelivery, WebhookEndpoint


class BaseRepository:
    model: type

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict):
        item = self.model(**data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get(self, item_id: int):
        return self.db.get(self.model, item_id)

    def update(self, item, data: dict):
        for key, value in data.items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item) -> None:
        self.db.delete(item)
        self.db.commit()


class IntegrationRepository(BaseRepository):
    model = Integration

    def list(self, workspace_id=None, provider=None, status=None, limit=100, offset=0):
        query = self.db.query(Integration)
        if workspace_id is not None:
            query = query.filter(Integration.workspace_id == workspace_id)
        if provider is not None:
            query = query.filter(Integration.provider == provider)
        if status is not None:
            query = query.filter(Integration.status == status)
        return query.order_by(Integration.id.desc()).offset(offset).limit(limit).all()


class ConnectorRepository(BaseRepository):
    model = Connector

    def list(self, integration_id=None, connector_type=None, status=None, limit=100, offset=0):
        query = self.db.query(Connector)
        if integration_id is not None:
            query = query.filter(Connector.integration_id == integration_id)
        if connector_type is not None:
            query = query.filter(Connector.connector_type == connector_type)
        if status is not None:
            query = query.filter(Connector.status == status)
        return query.order_by(Connector.id.desc()).offset(offset).limit(limit).all()


class WebhookEndpointRepository(BaseRepository):
    model = WebhookEndpoint

    def list(self, workspace_id=None, is_active=None, limit=100, offset=0):
        query = self.db.query(WebhookEndpoint)
        if workspace_id is not None:
            query = query.filter(WebhookEndpoint.workspace_id == workspace_id)
        if is_active is not None:
            query = query.filter(WebhookEndpoint.is_active == is_active)
        return query.order_by(WebhookEndpoint.id.desc()).offset(offset).limit(limit).all()


class WebhookDeliveryRepository(BaseRepository):
    model = WebhookDelivery

    def list(self, event_type=None, delivery_status=None, limit=100, offset=0):
        query = self.db.query(WebhookDelivery)
        if event_type is not None:
            query = query.filter(WebhookDelivery.event_type == event_type)
        if delivery_status is not None:
            query = query.filter(WebhookDelivery.delivery_status == delivery_status)
        return query.order_by(WebhookDelivery.id.desc()).offset(offset).limit(limit).all()


class EventSubscriptionRepository(BaseRepository):
    model = EventSubscription

    def list(self, workspace_id=None, event_name=None, is_active=None, limit=100, offset=0):
        query = self.db.query(EventSubscription)
        if workspace_id is not None:
            query = query.filter(EventSubscription.workspace_id == workspace_id)
        if event_name is not None:
            query = query.filter(EventSubscription.event_name == event_name)
        if is_active is not None:
            query = query.filter(EventSubscription.is_active == is_active)
        return query.order_by(EventSubscription.id.desc()).offset(offset).limit(limit).all()


class SyncJobRepository(BaseRepository):
    model = SyncJob

    def list(self, integration_id=None, status=None, job_type=None, limit=100, offset=0):
        query = self.db.query(SyncJob)
        if integration_id is not None:
            query = query.filter(SyncJob.integration_id == integration_id)
        if status is not None:
            query = query.filter(SyncJob.status == status)
        if job_type is not None:
            query = query.filter(SyncJob.job_type == job_type)
        return query.order_by(SyncJob.id.desc()).offset(offset).limit(limit).all()


class APIConnectionRepository(BaseRepository):
    model = APIConnection

    def list(self, workspace_id=None, provider=None, connection_status=None, limit=100, offset=0):
        query = self.db.query(APIConnection)
        if workspace_id is not None:
            query = query.filter(APIConnection.workspace_id == workspace_id)
        if provider is not None:
            query = query.filter(APIConnection.provider == provider)
        if connection_status is not None:
            query = query.filter(APIConnection.connection_status == connection_status)
        return query.order_by(APIConnection.id.desc()).offset(offset).limit(limit).all()
