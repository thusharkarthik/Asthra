from asthra_api_client.base import BaseAPIClient


class DocsClient(BaseAPIClient):
    def health(self):
        return self.get("/health")

    def list_pages(self, **params):
        return self.get("/api/v1/pages", params=params)
