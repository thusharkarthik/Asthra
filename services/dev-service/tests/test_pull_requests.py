from app.schemas.schemas import PullRequestCreate, PullRequestUpdate
from app.services.services import PullRequestService
from .conftest import create_repo

def test_pull_request_flow(db):
    repo = create_repo(db)
    pr = PullRequestService(db).create(PullRequestCreate(repository_id=repo.id, title="Change", author_id=1))
    assert PullRequestService(db).list(repository_id=repo.id, status="open", author_id=1, limit=10, offset=0)[0].id == pr.id
    assert PullRequestService(db).get(pr.id).title == "Change"
    assert PullRequestService(db).update(pr.id, PullRequestUpdate(status="merged")).status == "merged"
