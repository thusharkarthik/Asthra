from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.feature_request import FeatureRequestCreate, FeatureRequestRead, FeatureRequestUpdate
from app.services.feature_request_service import FeatureRequestService

router = APIRouter()


@router.post("", response_model=FeatureRequestRead, status_code=201)
def create_feature_request(data: FeatureRequestCreate, db: Session = Depends(get_db)):
    return FeatureRequestService(db).create(data)


@router.get("", response_model=list[FeatureRequestRead])
def list_feature_requests(
    workspace_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    source: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return FeatureRequestService(db).list(
        workspace_id=workspace_id,
        status=status,
        source=source,
        limit=limit,
        offset=offset,
    )


@router.get("/{feature_request_id}", response_model=FeatureRequestRead)
def get_feature_request(feature_request_id: int, db: Session = Depends(get_db)):
    return FeatureRequestService(db).get(feature_request_id)


@router.patch("/{feature_request_id}", response_model=FeatureRequestRead)
def update_feature_request(feature_request_id: int, data: FeatureRequestUpdate, db: Session = Depends(get_db)):
    return FeatureRequestService(db).update(feature_request_id, data)


@router.delete("/{feature_request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature_request(feature_request_id: int, db: Session = Depends(get_db)):
    FeatureRequestService(db).delete(feature_request_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
