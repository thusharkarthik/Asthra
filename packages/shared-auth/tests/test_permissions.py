from shared_auth.current_user import CurrentUserContext
from shared_auth.permissions import has_any_permission, has_permission, has_role


def test_permission_helpers():
    context = CurrentUserContext(
        user_id=1,
        roles=["admin", "member"],
        permissions=["projects:read", "projects:write"],
    )

    assert has_role(context, "admin") is True
    assert has_role(context, "viewer") is False
    assert has_permission(context, "projects:read") is True
    assert has_permission(context, "users:delete") is False
    assert has_any_permission(context, ["users:delete", "projects:write"]) is True
    assert has_any_permission(context, ["users:delete"]) is False
