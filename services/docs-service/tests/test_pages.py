from fastapi import HTTPException
from sqlalchemy import select

from app.models.page_version import PageVersion
from app.schemas.page import PageCreate, PageUpdate
from app.services.page_service import PageService
from tests.conftest import create_space


def test_page_crud_and_versions(db):
    space = create_space(db)
    service = PageService(db)
    page = service.create(
        PageCreate(
            space_id=space.id,
            title="Architecture",
            content="System overview",
            status="draft",
            created_by_id=1,
        ),
    )

    pages = service.list(space_id=space.id, status="draft")
    assert len(pages) == 1

    fetched_page = service.get(page.id)
    assert fetched_page.title == "Architecture"

    versions = db.scalars(select(PageVersion).where(PageVersion.page_id == page.id)).all()
    assert [version.version_number for version in versions] == [1]

    updated_page = service.update(
        page.id,
        PageUpdate(title="Architecture Overview", content="Updated overview", updated_by_id=2),
    )
    assert updated_page.title == "Architecture Overview"

    versions = db.scalars(
        select(PageVersion).where(PageVersion.page_id == page.id).order_by(PageVersion.version_number),
    ).all()
    assert [version.version_number for version in versions] == [1, 2]

    service.delete(page.id)
    try:
        service.get(page.id)
    except HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("Expected deleted page to return 404.")
