from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.access_control_service import AccessControlService


def require_permission(
    permission_code: str,
    scope_type: str = "platform",
    scope_id_param: str | None = None,
) -> Callable:
    """Return a FastAPI dependency that enforces one permission code.

    Dynamic payload-sensitive checks remain in service methods. This dependency
    is for endpoints whose action and scope are known before handler execution.
    """

    def dependency(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> None:
        normalized_scope = scope_type.strip().lower()
        scope_id: int | None = None
        if normalized_scope != "platform":
            param_name = scope_id_param or f"{normalized_scope}_id"
            raw_scope_id = request.path_params.get(param_name) or request.query_params.get(param_name)
            scope_id = int(raw_scope_id) if raw_scope_id is not None else None
        AccessControlService(db).require(current_user, permission_code, normalized_scope, scope_id)

    return dependency
