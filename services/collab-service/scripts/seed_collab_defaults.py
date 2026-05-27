from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.schemas.schemas import ActivityCreate, AnnouncementCreate, MessageCreate, TeamUpdateCreate, ThreadCreate
from app.services.services import ActivityService, AnnouncementService, MessageService, TeamUpdateService, ThreadService


def main():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        thread = ThreadService(db).create(ThreadCreate(workspace_id=1, project_id=1, entity_type="project", entity_id=1, title="Launch planning", created_by_id=1))
        MessageService(db).create(thread.id, MessageCreate(author_id=1, content="Initial async planning thread."))
        AnnouncementService(db).create(AnnouncementCreate(workspace_id=1, title="Weekly planning", content="Planning window is open.", status="published", created_by_id=1))
        TeamUpdateService(db).create(TeamUpdateCreate(workspace_id=1, team_id=1, title="Engineering update", content="Core services are progressing.", status="published", created_by_id=1))
        ActivityService(db).create(ActivityCreate(workspace_id=1, project_id=1, actor_user_id=1, entity_type="thread", entity_id=thread.id, action="created", description="Thread created."))
        print(f"Seeded Collab defaults with thread {thread.id}.")


if __name__ == "__main__":
    main()
