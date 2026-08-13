from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.api_key import APIKey
from app.models.user import User
from app.schemas.api_key import APIKeyCreate, APIKeyCreateResponse, APIKeyRead, APIKeyUpdate
from app.services.api_key_service import APIKeyService


router = APIRouter()


@router.post("", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    api_key_create: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKeyCreateResponse:
    return APIKeyService(db).create(api_key_create, current_user)


@router.get("", response_model=list[APIKeyRead])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[APIKey]:
    return APIKeyService(db).list(current_user)


@router.get("/{api_key_id}", response_model=APIKeyRead)
def get_api_key(
    api_key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKey:
    return APIKeyService(db).get(api_key_id, current_user)


@router.patch("/{api_key_id}", response_model=APIKeyRead)
def update_api_key(
    api_key_id: int,
    api_key_update: APIKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKey:
    return APIKeyService(db).update(api_key_id, api_key_update, current_user)


@router.delete("/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    api_key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    APIKeyService(db).delete(api_key_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{api_key_id}/revoke", response_model=APIKeyRead)
def revoke_api_key(
    api_key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKey:
    return APIKeyService(db).revoke(api_key_id, current_user)
