from shared_auth.current_user import CurrentUserContext


def has_role(user_context: CurrentUserContext, role: str) -> bool:
    return role in user_context.roles


def has_permission(user_context: CurrentUserContext, permission: str) -> bool:
    return permission in user_context.permissions


def has_any_permission(user_context: CurrentUserContext, permissions: list[str] | tuple[str, ...] | set[str]) -> bool:
    return any(permission in user_context.permissions for permission in permissions)
