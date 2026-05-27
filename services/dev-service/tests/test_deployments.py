from app.schemas.schemas import DeploymentCreate, DeploymentUpdate
from app.services.services import DeploymentService
from .conftest import create_env, create_service

def test_deployment_flow(db):
    env = create_env(db); svc = create_service(db)
    dep = DeploymentService(db).create(DeploymentCreate(workspace_id=1, environment_id=env.id, service_id=svc.id, version="1", status="pending"))
    assert DeploymentService(db).list(workspace_id=1, environment_id=env.id, status="pending", service_id=svc.id, limit=10, offset=0)[0].id == dep.id
    assert DeploymentService(db).get(dep.id).version == "1"
    assert DeploymentService(db).update(dep.id, DeploymentUpdate(status="success")).status == "success"
