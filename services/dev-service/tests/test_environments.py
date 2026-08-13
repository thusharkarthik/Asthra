from .conftest import create_env
from app.services.services import EnvironmentService

def test_environment_flow(db):
    env = create_env(db)
    assert EnvironmentService(db).list(workspace_id=1)[0].id == env.id
    assert EnvironmentService(db).get(env.id).environment_type == "prod"
