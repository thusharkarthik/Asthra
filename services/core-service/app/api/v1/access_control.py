from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.role import PermissionGapRead
from app.services.permission_service import PermissionService


router = APIRouter()


@router.get("/permission-inventory")
def get_permission_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return PermissionService(db).inventory()


@router.get("/permission-gaps", response_model=list[PermissionGapRead])
def get_permission_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return PermissionService(db).permission_gaps()
