from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.page import Page
from app.schemas.page import PageRead
from app.services.search_service import SearchService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and page access checks.
    return None


@router.get("/pages", response_model=list[PageRead])
def search_pages(
    q: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[Page]:
    return SearchService(db).search_pages(q, limit=limit, offset=offset)
