from pydantic import BaseModel


class ServiceInfoResponse(BaseModel):
    service: str
    version: str
    environment: str
    api_version: str | None = None
    api_prefix: str | None = None
