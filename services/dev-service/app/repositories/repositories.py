from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import Deployment, Environment, PullRequest, Release, Repository, ServiceCatalogItem, ServiceDependency, ServiceOwner


class Repo:
    model = None
    def __init__(self, db: Session): self.db = db
    def create(self, data):
        item = self.model(**data.model_dump())
        self.db.add(item); self.db.commit(); self.db.refresh(item); return item
    def get(self, item_id: int): return self.db.get(self.model, item_id)
    def update(self, item, data):
        for k, v in data.model_dump(exclude_unset=True).items(): setattr(item, k, v)
        self.db.add(item); self.db.commit(); self.db.refresh(item); return item
    def delete(self, item): self.db.delete(item); self.db.commit()


class RepositoryRepo(Repo):
    model = Repository
    def list(self, workspace_id=None, provider=None, project_id=None, limit=100, offset=0):
        stmt = select(Repository)
        if workspace_id is not None: stmt = stmt.where(Repository.workspace_id == workspace_id)
        if provider is not None: stmt = stmt.where(Repository.provider == provider)
        if project_id is not None: stmt = stmt.where(Repository.project_id == project_id)
        return list(self.db.scalars(stmt.order_by(Repository.id).limit(limit).offset(offset)).all())


class PullRequestRepo(Repo):
    model = PullRequest
    def list(self, repository_id=None, status=None, author_id=None, limit=100, offset=0):
        stmt = select(PullRequest)
        if repository_id is not None: stmt = stmt.where(PullRequest.repository_id == repository_id)
        if status is not None: stmt = stmt.where(PullRequest.status == status)
        if author_id is not None: stmt = stmt.where(PullRequest.author_id == author_id)
        return list(self.db.scalars(stmt.order_by(PullRequest.id).limit(limit).offset(offset)).all())


class EnvironmentRepo(Repo):
    model = Environment
    def list(self, workspace_id=None):
        stmt = select(Environment)
        if workspace_id is not None: stmt = stmt.where(Environment.workspace_id == workspace_id)
        return list(self.db.scalars(stmt.order_by(Environment.id)).all())


class ServiceRepo(Repo):
    model = ServiceCatalogItem
    def list(self, workspace_id=None, owner_id=None, lifecycle_status=None, limit=100, offset=0):
        stmt = select(ServiceCatalogItem)
        if owner_id is not None:
            stmt = stmt.join(ServiceOwner, ServiceOwner.service_id == ServiceCatalogItem.id).where(ServiceOwner.owner_id == owner_id)
        if workspace_id is not None: stmt = stmt.where(ServiceCatalogItem.workspace_id == workspace_id)
        if lifecycle_status is not None: stmt = stmt.where(ServiceCatalogItem.lifecycle_status == lifecycle_status)
        return list(self.db.scalars(stmt.order_by(ServiceCatalogItem.id).limit(limit).offset(offset)).all())


class DeploymentRepo(Repo):
    model = Deployment
    def list(self, workspace_id=None, environment_id=None, status=None, service_id=None, limit=100, offset=0):
        stmt = select(Deployment)
        if workspace_id is not None: stmt = stmt.where(Deployment.workspace_id == workspace_id)
        if environment_id is not None: stmt = stmt.where(Deployment.environment_id == environment_id)
        if status is not None: stmt = stmt.where(Deployment.status == status)
        if service_id is not None: stmt = stmt.where(Deployment.service_id == service_id)
        return list(self.db.scalars(stmt.order_by(Deployment.id).limit(limit).offset(offset)).all())


class ReleaseRepo(Repo):
    model = Release
    def list(self, workspace_id=None, status=None, service_id=None, limit=100, offset=0):
        stmt = select(Release)
        if workspace_id is not None: stmt = stmt.where(Release.workspace_id == workspace_id)
        if status is not None: stmt = stmt.where(Release.status == status)
        if service_id is not None: stmt = stmt.where(Release.service_id == service_id)
        return list(self.db.scalars(stmt.order_by(Release.id).limit(limit).offset(offset)).all())


class OwnerRepo(Repo):
    model = ServiceOwner
    def create_for_service(self, service_id, data):
        item = ServiceOwner(service_id=service_id, **data.model_dump()); self.db.add(item); self.db.commit(); self.db.refresh(item); return item
    def list_by_service(self, service_id): return list(self.db.scalars(select(ServiceOwner).where(ServiceOwner.service_id == service_id).order_by(ServiceOwner.id)).all())


class DependencyRepo(Repo):
    model = ServiceDependency
    def create_for_service(self, service_id, data):
        item = ServiceDependency(service_id=service_id, **data.model_dump()); self.db.add(item); self.db.commit(); self.db.refresh(item); return item
    def list_by_service(self, service_id): return list(self.db.scalars(select(ServiceDependency).where(ServiceDependency.service_id == service_id).order_by(ServiceDependency.id)).all())
