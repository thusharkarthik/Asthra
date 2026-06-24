def test_app_main_imports():
    from app.main import app

    assert app.title == "asthra-core-service"


def test_permission_service_imports():
    from app.services.permission_service import PermissionService

    assert PermissionService is not None
