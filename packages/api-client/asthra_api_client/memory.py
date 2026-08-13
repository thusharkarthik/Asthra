from asthra_api_client.base import BaseAPIClient


class MemoryClient(BaseAPIClient):
    def health(self):
        return self.get("/health")

    def search(self, payload: dict):
        return self.post("/api/v1/retrieval/search", json=payload)
