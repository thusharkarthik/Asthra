from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.schemas.schemas import DeploymentCreate, EnvironmentCreate, ReleaseCreate, RepositoryCreate, ServiceCreate
from app.services.services import DeploymentService, EnvironmentService, ReleaseService, RepositoryService, ServiceCatalogService


def main():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        repo = RepositoryService(db).create(RepositoryCreate(workspace_id=1, project_id=1, name="asthra-core", provider="github", url="https://example.com/asthra-core"))
        env = EnvironmentService(db).create(EnvironmentCreate(workspace_id=1, name="Production", environment_type="prod"))
        svc = ServiceCatalogService(db).create(ServiceCreate(workspace_id=1, repository_id=repo.id, name="core-service", lifecycle_status="active"))
        dep = DeploymentService(db).create(DeploymentCreate(workspace_id=1, environment_id=env.id, service_id=svc.id, version="0.1.0", status="success"))
        rel = ReleaseService(db).create(ReleaseCreate(workspace_id=1, service_id=svc.id, version="0.1.0", status="released"))
        print(f"Seeded Dev defaults with repository {repo.id}, deployment {dep.id}, release {rel.id}.")


if __name__ == "__main__":
    main()
