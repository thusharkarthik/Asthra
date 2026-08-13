from app.connectors.base_connector import BaseConnector


class GenericWebhookConnector(BaseConnector):
    provider = "generic_webhook"
