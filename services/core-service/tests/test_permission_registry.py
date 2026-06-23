from app.db.session import SessionLocal
from app.models.permission import Permission
from app.services.permission_service import PermissionService
from tests.conftest import create_auth_headers


def test_permission_registry_generates_action_permissions():
    db = SessionLocal()
    try:
        PermissionService(db).ensure_permission_catalog()

        restore_project = db.query(Permission).filter(Permission.code == "settings.project.restore").first()
        edit_team = db.query(Permission).filter(Permission.code == "settings.team.edit").first()

        assert restore_project is not None
        assert restore_project.resource == "project"
        assert restore_project.action == "restore"
        assert restore_project.risk_level == "high"
        assert restore_project.source == "registry"
        assert edit_team is not None
        assert edit_team.resource == "team"
        assert edit_team.action == "edit"
    finally:
        db.close()


def test_permission_registry_sync_preserves_custom_permissions():
    db = SessionLocal()
    try:
        custom = Permission(
            key="custom.demo.execute",
            code="custom.demo.execute",
            name="Execute Demo",
            description="Custom permission for a local test.",
            module="custom",
            resource="demo",
            action="execute",
            scope="workspace",
            risk_level="medium",
            source="custom",
            status="active",
            is_active=True,
        )
        db.add(custom)
        db.commit()

        PermissionService(db).ensure_permission_catalog()
        preserved = db.query(Permission).filter(Permission.code == "custom.demo.execute").first()

        assert preserved is not None
        assert preserved.source == "custom"
        assert preserved.status == "active"
    finally:
        db.close()


def test_permission_gaps_report_inactive_registry_permission():
    db = SessionLocal()
    try:
        PermissionService(db).ensure_permission_catalog()
        permission = db.query(Permission).filter(Permission.code == "settings.project.restore").first()
        assert permission is not None
        permission.status = "inactive"
        permission.is_active = False
        db.commit()

        gaps = PermissionService(db).permission_gaps()

        assert any(gap["expected_permission_code"] == "settings.project.restore" and gap["status"] == "inactive" for gap in gaps)
    finally:
        db.close()


def test_permission_inventory_endpoint_returns_summary(client):
    headers = create_auth_headers(client)

    response = client.get("/api/v1/access-control/permission-inventory", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_permissions"] >= 1
    assert "settings" in payload["by_module"]
    assert "roles_using_each_permission" in payload


def test_permission_gaps_endpoint_returns_gap_categories(client):
    headers = create_auth_headers(client)

    response = client.get("/api/v1/access-control/permission-gaps", headers=headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)
