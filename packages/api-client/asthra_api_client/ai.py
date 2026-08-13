from asthra_api_client.base import BaseAPIClient


class AIClient(BaseAPIClient):
    def health(self):
        return self.get("/health")

    def chat_completion(self, payload: dict):
        return self.post("/api/v1/completions/chat", json=payload)
