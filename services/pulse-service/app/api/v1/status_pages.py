from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.status_page import StatusPageComponentCreate, StatusPageComponentRead, StatusPageComponentUpdate, StatusPageCreate, StatusPageRead
from app.services.services import ComponentService, StatusPageService

router = APIRouter()

@router.post("", response_model=StatusPageRead, status_code=201)
def create_page(data: StatusPageCreate, db: Session = Depends(get_db)): return StatusPageService(db).create(data)

@router.get("", response_model=list[StatusPageRead])
def list_pages(workspace_id: int | None = None, is_public: bool | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    return StatusPageService(db).list(workspace_id=workspace_id, is_public=is_public, limit=limit, offset=offset)

@router.get("/{status_page_id}", response_model=StatusPageRead)
def get_page(status_page_id: int, db: Session = Depends(get_db)): return StatusPageService(db).get(status_page_id)

@router.post("/{status_page_id}/components", response_model=StatusPageComponentRead, status_code=201)
def create_component(status_page_id: int, data: StatusPageComponentCreate, db: Session = Depends(get_db)): return ComponentService(db).create(status_page_id, data)

@router.get("/{status_page_id}/components", response_model=list[StatusPageComponentRead])
def list_components(status_page_id: int, db: Session = Depends(get_db)): return ComponentService(db).list_by_page(status_page_id)


component_router = APIRouter()

@component_router.patch("/{component_id}", response_model=StatusPageComponentRead)
def update_component(component_id: int, data: StatusPageComponentUpdate, db: Session = Depends(get_db)): return ComponentService(db).update(component_id, data)
