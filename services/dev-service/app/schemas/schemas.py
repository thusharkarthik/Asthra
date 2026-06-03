from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReadBase(BaseModel):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FullRead(ReadBase):
    updated_at: datetime


class RepositoryCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    name: str = Field(min_length=1, max_length=255)
    provider: str
    url: str | None = None
    default_branch: str | None = None


class RepositoryUpdate(BaseModel):
    project_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    provider: str | None = None
    url: str | None = None
    default_branch: str | None = None


class RepositoryRead(RepositoryCreate, FullRead): pass


class PullRequestCreate(BaseModel):
    repository_id: int
    title: str = Field(min_length=1, max_length=255)
    external_id: str | None = None
    status: str = "open"
    author_id: int | None = None
    url: str | None = None


class PullRequestUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    external_id: str | None = None
    status: str | None = None
    author_id: int | None = None
    url: str | None = None


class PullRequestRead(PullRequestCreate, FullRead): pass


class EnvironmentCreate(BaseModel):
    workspace_id: int
    name: str = Field(min_length=1, max_length=255)
    environment_type: str


class EnvironmentRead(EnvironmentCreate, ReadBase): pass


class ServiceCreate(BaseModel):
    workspace_id: int
    repository_id: int | None = None
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    lifecycle_status: str = "active"


class ServiceUpdate(BaseModel):
    repository_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    lifecycle_status: str | None = None


class ServiceRead(ServiceCreate, FullRead): pass


class DeploymentCreate(BaseModel):
    workspace_id: int
    environment_id: int
    service_id: int | None = None
    version: str | None = None
    status: str = "pending"


class DeploymentUpdate(BaseModel):
    environment_id: int | None = None
    service_id: int | None = None
    version: str | None = None
    status: str | None = None


class DeploymentRead(DeploymentCreate, FullRead): pass


class ReleaseCreate(BaseModel):
    workspace_id: int
    service_id: int | None = None
    version: str = Field(min_length=1, max_length=255)
    notes: str | None = None
    status: str = "planned"


class ReleaseUpdate(BaseModel):
    service_id: int | None = None
    version: str | None = Field(default=None, min_length=1, max_length=255)
    notes: str | None = None
    status: str | None = None


class ReleaseRead(ReleaseCreate, FullRead): pass


class ReleaseAISummaryRead(BaseModel):
    release_id: int
    release_overview: str | None = None
    shipped_changes: list[str] = []
    deployment_risk: str | None = None
    rollback_considerations: str | None = None
    stakeholder_summary: str | None = None
    qa_notes: list[str] = []
    raw_response: str | None = None


class ReleaseMemoryDocumentPayload(BaseModel):
    source_type: str = "release"
    external_reference: str
    workspace_id: int
    title: str
    content: str
    metadata: dict


class ServiceOwnerCreate(BaseModel):
    owner_id: int
    role: str | None = None


class ServiceOwnerRead(ServiceOwnerCreate, ReadBase):
    service_id: int


class ServiceDependencyCreate(BaseModel):
    depends_on_service_id: int
    dependency_type: str | None = None


class ServiceDependencyRead(ServiceDependencyCreate, ReadBase):
    service_id: int
