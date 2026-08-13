from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.change_request import ChangeRequestCreate, ChangeRequestRead, ChangeRequestUpdate
from app.services.change_request_service import ChangeRequestService

router = APIRouter()


@router.post("", response_model=ChangeRequestRead, status_code=201)
def create_change_request(data: ChangeRequestCreate, db: Session = Depends(get_db)):
    return ChangeRequestService(db).create(data)


@router.get("", response_model=list[ChangeRequestRead])
def list_change_requests(workspace_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return ChangeRequestService(db).list(workspace_id)


@router.get("/{change_request_id}", response_model=ChangeRequestRead)
def get_change_request(change_request_id: int, db: Session = Depends(get_db)):
    return ChangeRequestService(db).get(change_request_id)


@router.patch("/{change_request_id}", response_model=ChangeRequestRead)
def update_change_request(change_request_id: int, data: ChangeRequestUpdate, db: Session = Depends(get_db)):
    return ChangeRequestService(db).update(change_request_id, data)
