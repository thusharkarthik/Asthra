from app.db.session import SessionLocal
from app.models.permission import Permission
from app.services.permission_registry import iter_registry_permissions
from app.services.permission_service import PermissionService
from tests.conftest import create_auth_headers


def test_permission_registry_phase_b_contains_expected_codes():
    codes = {item.code for item in iter_registry_permissions()}

    assert "settings.project.restore" in codes
    assert "settings.team.member.add" in codes
    assert "flow.work_item.transition" in codes
    assert "docs.page.publish" in codes
    assert "discover.feature_request.convert" in codes
    assert "desk.ticket.resolve" in codes
    assert "pulse.incident.close" in codes
    assert "collab.announcement.publish" in codes


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


def test_permission_registry_sync_preview_does_not_modify_database():
    db = SessionLocal()
    try:
        service = PermissionService(db)

        preview = service.sync_registry_permissions(dry_run=True)
        permission_count = db.query(Permission).count()

        assert preview["created_count"] == preview["total_registry_permissions"]
        assert permission_count == 0
    finally:
        db.close()


def test_permission_registry_sync_creates_missing_permissions():
    db = SessionLocal()
    try:
        service = PermissionService(db)

        result = service.sync_registry_permissions(dry_run=False)
        permission_count = db.query(Permission).count()

        assert result["created_count"] == result["total_registry_permissions"]
        assert permission_count == result["total_registry_permissions"]
        assert db.query(Permission).filter(Permission.code == "docs.page.publish").first() is not None
    finally:
        db.close()


def test_permission_registry_sync_updates_metadata():
    db = SessionLocal()
    try:
        permission = Permission(
            key="settings.project.restore",
            code="settings.project.restore",
            name="Old Name",
            description="Old description.",
            module="settings",
            resource="project",
            action="restore",
            scope="workspace",
            risk_level="low",
            source="registry",
            status="active",
            is_system=False,
            is_active=True,
        )
        db.add(permission)
        db.commit()

        result = PermissionService(db).sync_registry_permissions(dry_run=False)
        updated = db.query(Permission).filter(Permission.code == "settings.project.restore").first()

        assert "settings.project.restore" in result["updated"]
        assert updated is not None
        assert updated.name == "Restore Project"
        assert updated.scope == "project"
        assert updated.risk_level == "high"
        assert updated.is_system is True
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


def test_permission_registry_sync_deprecates_removed_registry_permissions():
    db = SessionLocal()
    try:
        stale = Permission(
            key="legacy.module.view",
            code="legacy.module.view",
            name="View Legacy Module",
            description="Old registry permission.",
            module="legacy",
            resource="module",
            action="view",
            scope="workspace",
            risk_level="low",
            source="registry",
            status="active",
            is_system=True,
            is_active=True,
        )
        db.add(stale)
        db.commit()

        result = PermissionService(db).sync_registry_permissions(dry_run=False)
        deprecated = db.query(Permission).filter(Permission.code == "legacy.module.view").first()

        assert "legacy.module.view" in result["deprecated"]
        assert deprecated is not None
        assert deprecated.status == "deprecated"
        assert deprecated.is_active is False
    finally:
        db.close()


def test_role_mapping_suggestions_return_expected_shape():
    db = SessionLocal()
    try:
        suggestions = PermissionService(db).role_mapping_suggestions()
        by_key = {suggestion["role_key"]: suggestion for suggestion in suggestions}

        assert "organization_owner" in by_key
        assert "settings.project.restore" in by_key["organization_owner"]["suggested_permissions"]
        assert by_key["organization_owner"]["note"] == "Suggestion only. Permissions are not automatically applied."
        assert by_key["project_manager"]["suggested_count"] >= 1
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
