from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.repositories import DependencyRepo, DeploymentRepo, EnvironmentRepo, OwnerRepo, PullRequestRepo, ReleaseRepo, RepositoryRepo, ServiceRepo
from app.schemas.schemas import ReleaseAISummaryRead, ReleaseMemoryDocumentPayload
from app.services.ai_client import AIClient

PROVIDERS = {"github", "gitlab", "bitbucket", "other"}
PR_STATUSES = {"open", "merged", "closed"}
DEPLOY_STATUSES = {"pending", "running", "success", "failed", "rolled_back"}
RELEASE_STATUSES = {"planned", "in_progress", "released", "cancelled"}
ENV_TYPES = {"dev", "test", "staging", "prod"}
LIFECYCLES = {"experimental", "active", "deprecated", "retired"}


def nf(name): raise HTTPException(status_code=404, detail=f"{name} not found.")
def invalid(msg): raise HTTPException(status_code=400, detail=msg)


class RepositoryService:
    def __init__(self, db: Session): self.repo = RepositoryRepo(db)
    def create(self, d):
        if d.provider not in PROVIDERS: invalid("Invalid repository provider.")
        return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Repository")
        return x
    def update(self, i, d):
        if d.provider is not None and d.provider not in PROVIDERS: invalid("Invalid repository provider.")
        return self.repo.update(self.get(i), d)
    def delete(self, i): self.repo.delete(self.get(i))


class PullRequestService:
    def __init__(self, db: Session): self.repo = PullRequestRepo(db); self.repositories = RepositoryService(db)
    def create(self, d):
        self.repositories.get(d.repository_id)
        if d.status not in PR_STATUSES: invalid("Invalid pull request status.")
        return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Pull request")
        return x
    def update(self, i, d):
        if d.status is not None and d.status not in PR_STATUSES: invalid("Invalid pull request status.")
        return self.repo.update(self.get(i), d)


class EnvironmentService:
    def __init__(self, db: Session): self.repo = EnvironmentRepo(db)
    def create(self, d):
        if d.environment_type not in ENV_TYPES: invalid("Invalid environment type.")
        return self.repo.create(d)
    def list(self, workspace_id=None): return self.repo.list(workspace_id)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Environment")
        return x


class ServiceCatalogService:
    def __init__(self, db: Session): self.repo = ServiceRepo(db); self.repositories = RepositoryService(db)
    def create(self, d):
        if d.lifecycle_status not in LIFECYCLES: invalid("Invalid service lifecycle status.")
        if d.repository_id is not None: self.repositories.get(d.repository_id)
        return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Service")
        return x
    def update(self, i, d):
        if d.lifecycle_status is not None and d.lifecycle_status not in LIFECYCLES: invalid("Invalid service lifecycle status.")
        if d.repository_id is not None: self.repositories.get(d.repository_id)
        return self.repo.update(self.get(i), d)
    def delete(self, i): self.repo.delete(self.get(i))


class DeploymentService:
    def __init__(self, db: Session): self.repo = DeploymentRepo(db); self.envs = EnvironmentService(db); self.services = ServiceCatalogService(db)
    def create(self, d):
        self.envs.get(d.environment_id)
        if d.service_id is not None: self.services.get(d.service_id)
        if d.status not in DEPLOY_STATUSES: invalid("Invalid deployment status.")
        return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Deployment")
        return x
    def update(self, i, d):
        if d.status is not None and d.status not in DEPLOY_STATUSES: invalid("Invalid deployment status.")
        if d.environment_id is not None: self.envs.get(d.environment_id)
        if d.service_id is not None: self.services.get(d.service_id)
        return self.repo.update(self.get(i), d)
    # TODO: Add AI deployment risk analysis later.


class ReleaseService:
    def __init__(self, db: Session): self.repo = ReleaseRepo(db); self.services = ServiceCatalogService(db)
    def create(self, d):
        if d.service_id is not None: self.services.get(d.service_id)
        if d.status not in RELEASE_STATUSES: invalid("Invalid release status.")
        return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Release")
        return x
    def update(self, i, d):
        if d.status is not None and d.status not in RELEASE_STATUSES: invalid("Invalid release status.")
        if d.service_id is not None: self.services.get(d.service_id)
        return self.repo.update(self.get(i), d)
    def ai_summary(self, i: int, request_id: str | None = None) -> ReleaseAISummaryRead:
        release = self.get(i)
        service = self.services.get(release.service_id) if release.service_id is not None else None
        deployments = DeploymentRepo(self.repo.db).list(workspace_id=release.workspace_id, service_id=release.service_id, limit=10, offset=0) if release.service_id is not None else []
        deployment_text = "\n".join(f"- version={deployment.version} status={deployment.status}" for deployment in deployments) or "No related deployments found."
        service_text = f"{service.name} ({service.lifecycle_status})" if service is not None else "No service linked"
        prompt = (
            "Summarize this software release. Respond as JSON with keys: release_overview, shipped_changes, "
            "deployment_risk, rollback_considerations, stakeholder_summary, qa_notes.\n\n"
            f"Version: {release.version}\nStatus: {release.status}\nNotes: {release.notes or 'No notes'}\n"
            f"Service: {service_text}\nDeployments:\n{deployment_text}"
        )
        result = AIClient().complete(
            prompt,
            system_prompt="You are an engineering release manager. Return concise JSON only.",
            request_id=request_id,
        )
        return ReleaseAISummaryRead(
            release_id=release.id,
            release_overview=result.get("release_overview"),
            shipped_changes=result.get("shipped_changes") or [],
            deployment_risk=result.get("deployment_risk"),
            rollback_considerations=result.get("rollback_considerations"),
            stakeholder_summary=result.get("stakeholder_summary"),
            qa_notes=result.get("qa_notes") or [],
            raw_response=result.get("raw_response"),
        )
    def prepare_memory_document(self, i: int) -> ReleaseMemoryDocumentPayload:
        release = self.get(i)
        service = self.services.get(release.service_id) if release.service_id is not None else None
        service_text = f"Service: {service.name}" if service is not None else "Service: none"
        return ReleaseMemoryDocumentPayload(
            external_reference=f"release:{release.id}",
            workspace_id=release.workspace_id,
            title=f"Release {release.version}",
            content="\n\n".join(part for part in [f"Version: {release.version}", f"Status: {release.status}", service_text, release.notes] if part),
            metadata={
                "release_id": release.id,
                "service_id": release.service_id,
                "status": release.status,
                "version": release.version,
            },
        )


class OwnerService:
    def __init__(self, db: Session): self.repo = OwnerRepo(db); self.services = ServiceCatalogService(db)
    def create(self, sid, d): self.services.get(sid); return self.repo.create_for_service(sid, d)
    def list(self, sid): self.services.get(sid); return self.repo.list_by_service(sid)
    def delete(self, sid, owner_id): self.services.get(sid); self.repo.delete(self.repo.get(owner_id) or nf("Service owner"))


class DependencyService:
    def __init__(self, db: Session): self.repo = DependencyRepo(db); self.services = ServiceCatalogService(db)
    def create(self, sid, d):
        self.services.get(sid); self.services.get(d.depends_on_service_id)
        if sid == d.depends_on_service_id: invalid("Service cannot depend on itself.")
        return self.repo.create_for_service(sid, d)
    def list(self, sid): self.services.get(sid); return self.repo.list_by_service(sid)
    def delete(self, sid, dep_id): self.services.get(sid); self.repo.delete(self.repo.get(dep_id) or nf("Service dependency"))
    # TODO: Add AI service dependency risk detection and architecture insight generation later.
