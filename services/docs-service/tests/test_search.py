from app.services.search_service import SearchService
from tests.conftest import create_page


def test_basic_page_search(db):
    create_page(db, title="Architecture Notes", content="Platform service overview")
    create_page(db, title="Onboarding", content="Team setup")

    results = SearchService(db).search_pages("platform")

    assert len(results) == 1
    assert results[0].title == "Architecture Notes"
