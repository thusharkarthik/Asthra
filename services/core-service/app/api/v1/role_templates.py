from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.role import RoleTemplateRead
from app.services.role_service import RoleService

router = APIRouter()


@router.get("", response_model=list[RoleTemplateRead])
def list_role_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return RoleService(db).list_templates(current_user)
