from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.audit_event import AuditEventRead
from app.services.audit_service import AuditService

router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and scoped audit access.
    return None


@router.get("/audit-events", response_model=list[AuditEventRead])
def list_audit_events(
    project_id: int | None = None,
    work_item_id: int | None = None,
    actor_id: int | None = None,
    action: str | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[AuditEventRead]:
    return AuditService(db).list(
        project_id=project_id,
        work_item_id=work_item_id,
        actor_id=actor_id,
        action=action,
        created_from=created_from,
        created_to=created_to,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/work-items/{work_item_id}/audit-events", response_model=list[AuditEventRead])
def list_work_item_audit_events(
    work_item_id: int,
    actor_id: int | None = None,
    action: str | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[AuditEventRead]:
    return AuditService(db).list(
        work_item_id=work_item_id,
        actor_id=actor_id,
        action=action,
        created_from=created_from,
        created_to=created_to,
        limit=limit,
        offset=offset,
    )
