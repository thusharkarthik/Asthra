from asthra_api_client.base import BaseAPIClient


class CoreClient(BaseAPIClient):
    def health(self):
        return self.get("/health")

    def current_user(self):
        return self.get("/api/v1/auth/me")

    def list_projects(self, **params):
        return self.get("/api/v1/projects", params=params)
