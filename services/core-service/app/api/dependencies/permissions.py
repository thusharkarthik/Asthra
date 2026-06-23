from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.access_control_service import AccessControlService


ScopeResolver = Callable[[Request], tuple[str | None, int | None]]


def path_scope(scope_type: str, path_param: str) -> ScopeResolver:
    def resolve(request: Request) -> tuple[str, int | None]:
        value = request.path_params.get(path_param)
        return scope_type, int(value) if value is not None else None

    return resolve


def require_permission(permission_code: str, scope_type_resolver: ScopeResolver | None = None):
    def dependency(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> User:
        scope_type, scope_id = scope_type_resolver(request) if scope_type_resolver is not None else (None, None)
        AccessControlService(db).require(current_user, permission_code, scope_type, scope_id)
        return current_user

    return dependency


def permission_action(
    *,
    action_key: str,
    permission_code: str,
    scope_type: str,
    scope_id: Any,
) -> dict[str, Any]:
    return {
        "actionKey": action_key,
        "permissionCode": permission_code,
        "scopeType": scope_type,
        "scopeId": scope_id,
    }
