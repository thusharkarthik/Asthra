from shared_auth.current_user import CurrentUserContext


def test_current_user_context_creation():
    context = CurrentUserContext(
        user_id=1,
        email="user@example.com",
        organization_id=10,
        workspace_id=20,
        roles=["admin"],
        permissions=["projects:read"],
    )

    assert context.user_id == 1
    assert context.email == "user@example.com"
    assert context.organization_id == 10
    assert context.workspace_id == 20
    assert context.roles == ["admin"]
    assert context.permissions == ["projects:read"]
