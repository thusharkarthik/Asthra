import pytest
from fastapi import HTTPException
from app.schemas.schemas import RepositoryUpdate
from app.services.services import RepositoryService
from .conftest import create_repo

def test_repository_crud(db):
    repo = create_repo(db)
    assert RepositoryService(db).list(workspace_id=1, provider="github", project_id=1, limit=10, offset=0)[0].id == repo.id
    assert RepositoryService(db).get(repo.id).name == "repo"
    assert RepositoryService(db).update(repo.id, RepositoryUpdate(default_branch="main")).default_branch == "main"
    RepositoryService(db).delete(repo.id)
    with pytest.raises(HTTPException): RepositoryService(db).get(repo.id)
