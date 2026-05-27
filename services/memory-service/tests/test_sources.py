from app.services.source_service import SourceService

from .conftest import create_source


def test_create_list_and_get_source(db):
    source = create_source(db, workspace_id=42, name="Product notes")

    sources = SourceService(db).list(workspace_id=42)
    assert [item.id for item in sources] == [source.id]

    fetched = SourceService(db).get(source.id)
    assert fetched.name == "Product notes"
    assert fetched.source_type == "manual"
