from asthra_api_client.base import BaseAPIClient


class FlowClient(BaseAPIClient):
    def health(self):
        return self.get("/health")

    def list_work_items(self, **params):
        return self.get("/api/v1/work-items", params=params)
