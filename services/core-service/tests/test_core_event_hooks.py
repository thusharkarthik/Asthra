from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.organization import OrganizationCreate
from app.schemas.project import ProjectCreate
from app.schemas.workspace import WorkspaceCreate
from app.services.organization_service import OrganizationService
from app.services.project_service import ProjectService
from app.services.workspace_service import WorkspaceService


def test_core_create_services_publish_events(monkeypatch):
    published_events = []
    monkeypatch.setattr(
        "app.services.organization_service.publish_event",
        lambda event_name, **kwargs: published_events.append(event_name),
    )
    monkeypatch.setattr(
        "app.services.workspace_service.publish_event",
        lambda event_name, **kwargs: published_events.append(event_name),
    )
    monkeypatch.setattr(
        "app.services.project_service.publish_event",
        lambda event_name, **kwargs: published_events.append(event_name),
    )

    db = SessionLocal()
    try:
        user = User(
            email="event-user@example.com",
            full_name="Event User",
            hashed_password="not-used",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        organization = OrganizationService(db).create(
            OrganizationCreate(name="Event Org", description="Testing events"),
            user,
        )
        workspace = WorkspaceService(db).create(
            WorkspaceCreate(
                organization_id=organization.id,
                name="Event Workspace",
                description="Testing events",
            ),
            user,
        )
        ProjectService(db).create(
            ProjectCreate(
                workspace_id=workspace.id,
                name="Event Project",
                description="Testing events",
                status="active",
            ),
            user,
        )
    finally:
        db.close()

    assert published_events == [
        "core.organization.created",
        "core.workspace.created",
        "core.project.created",
    ]
