from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.page import Page
from app.schemas.flow_link import DocFlowLinkRead, PageFlowWorkItemCreate
from app.schemas.page import PageAISummaryRead, PageCreate, PageMemoryDocumentPayload, PageRead, PageUpdate, PageVersionRead
from app.services.flow_link_service import FlowLinkService
from app.services.page_service import PageService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and space access checks.
    return None


@router.post("", response_model=PageRead, status_code=status.HTTP_201_CREATED)
def create_page(
    page_create: PageCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Page:
    return PageService(db).create(page_create)


@router.get("", response_model=list[PageRead])
def list_pages(
    space_id: int | None = None,
    status: str | None = None,
    created_by_id: int | None = None,
    parent_page_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[Page]:
    return PageService(db).list(
        space_id=space_id,
        status=status,
        created_by_id=created_by_id,
        parent_page_id=parent_page_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{page_id}", response_model=PageRead)
def get_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Page:
    return PageService(db).get(page_id)


@router.get("/{page_id}/versions", response_model=list[PageVersionRead])
def list_page_versions(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
):
    return PageService(db).list_versions(page_id)


@router.post("/{page_id}/prepare-memory-document", response_model=PageMemoryDocumentPayload)
def prepare_memory_document(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> PageMemoryDocumentPayload:
    return PageService(db).prepare_memory_document(page_id)


@router.post("/{page_id}/ai-summary", response_model=PageAISummaryRead)
def summarize_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> PageAISummaryRead:
    return PageService(db).ai_summary(page_id)


@router.post("/{page_id}/flow-work-items", response_model=DocFlowLinkRead, status_code=status.HTTP_201_CREATED)
def create_flow_work_item_from_page(
    page_id: int,
    data: PageFlowWorkItemCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
):
    return FlowLinkService(db).create_work_item_from_page(page_id, data)


@router.get("/{page_id}/flow-work-items", response_model=list[DocFlowLinkRead])
def list_page_flow_work_items(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
):
    return FlowLinkService(db).list_page_work_items(page_id)


@router.patch("/{page_id}", response_model=PageRead)
def update_page(
    page_id: int,
    page_update: PageUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Page:
    return PageService(db).update(page_id, page_update)


@router.post("/{page_id}/publish", response_model=PageRead)
def publish_page(
    page_id: int,
    updated_by_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Page:
    return PageService(db).publish(page_id, updated_by_id=updated_by_id)


@router.post("/{page_id}/archive", response_model=PageRead)
def archive_page(
    page_id: int,
    updated_by_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Page:
    return PageService(db).archive(page_id, updated_by_id=updated_by_id)


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    PageService(db).delete(page_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
