from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import ActivityStreamItem, Announcement, Mention, Reaction, TeamUpdate, Thread, ThreadMessage


class Repo:
    model = None
    def __init__(self, db: Session): self.db = db
    def create(self, data):
        item = self.model(**data.model_dump()); self.db.add(item); self.db.commit(); self.db.refresh(item); return item
    def get(self, item_id): return self.db.get(self.model, item_id)
    def update(self, item, data):
        for k, v in data.model_dump(exclude_unset=True).items(): setattr(item, k, v)
        self.db.add(item); self.db.commit(); self.db.refresh(item); return item
    def delete(self, item): self.db.delete(item); self.db.commit()


class ThreadRepo(Repo):
    model = Thread
    def list(self, workspace_id=None, project_id=None, entity_type=None, entity_id=None, created_by_id=None, limit=100, offset=0):
        stmt = select(Thread)
        for field, value in {"workspace_id": workspace_id, "project_id": project_id, "entity_type": entity_type, "entity_id": entity_id, "created_by_id": created_by_id}.items():
            if value is not None: stmt = stmt.where(getattr(Thread, field) == value)
        return list(self.db.scalars(stmt.order_by(Thread.id).limit(limit).offset(offset)).all())


class MessageRepo(Repo):
    model = ThreadMessage
    def create_for_thread(self, thread_id, data):
        item = ThreadMessage(thread_id=thread_id, **data.model_dump()); self.db.add(item); self.db.commit(); self.db.refresh(item); return item
    def list_by_thread(self, thread_id): return list(self.db.scalars(select(ThreadMessage).where(ThreadMessage.thread_id == thread_id).order_by(ThreadMessage.id)).all())


class MentionRepo(Repo):
    model = Mention
    def list(self, workspace_id=None, mentioned_user_id=None, limit=100, offset=0):
        stmt = select(Mention)
        if workspace_id is not None: stmt = stmt.where(Mention.workspace_id == workspace_id)
        if mentioned_user_id is not None: stmt = stmt.where(Mention.mentioned_user_id == mentioned_user_id)
        return list(self.db.scalars(stmt.order_by(Mention.id).limit(limit).offset(offset)).all())


class ReactionRepo(Repo):
    model = Reaction
    def find_duplicate(self, data):
        return self.db.scalars(select(Reaction).where(Reaction.user_id == data.user_id, Reaction.entity_type == data.entity_type, Reaction.entity_id == data.entity_id, Reaction.emoji == data.emoji)).first()
    def list(self, workspace_id=None, entity_type=None, entity_id=None, limit=100, offset=0):
        stmt = select(Reaction)
        if workspace_id is not None: stmt = stmt.where(Reaction.workspace_id == workspace_id)
        if entity_type is not None: stmt = stmt.where(Reaction.entity_type == entity_type)
        if entity_id is not None: stmt = stmt.where(Reaction.entity_id == entity_id)
        return list(self.db.scalars(stmt.order_by(Reaction.id).limit(limit).offset(offset)).all())


class AnnouncementRepo(Repo):
    model = Announcement
    def list(self, workspace_id=None, created_by_id=None, status=None, limit=100, offset=0):
        stmt = select(Announcement)
        if workspace_id is not None: stmt = stmt.where(Announcement.workspace_id == workspace_id)
        if created_by_id is not None: stmt = stmt.where(Announcement.created_by_id == created_by_id)
        if status is not None: stmt = stmt.where(Announcement.status == status)
        return list(self.db.scalars(stmt.order_by(Announcement.id).limit(limit).offset(offset)).all())


class ActivityRepo(Repo):
    model = ActivityStreamItem
    def list(self, workspace_id=None, project_id=None, entity_type=None, actor_user_id=None, limit=100, offset=0):
        stmt = select(ActivityStreamItem)
        if workspace_id is not None: stmt = stmt.where(ActivityStreamItem.workspace_id == workspace_id)
        if project_id is not None: stmt = stmt.where(ActivityStreamItem.project_id == project_id)
        if entity_type is not None: stmt = stmt.where(ActivityStreamItem.entity_type == entity_type)
        if actor_user_id is not None: stmt = stmt.where(ActivityStreamItem.actor_user_id == actor_user_id)
        return list(self.db.scalars(stmt.order_by(ActivityStreamItem.id).limit(limit).offset(offset)).all())


class TeamUpdateRepo(Repo):
    model = TeamUpdate
    def list(self, workspace_id=None, team_id=None, status=None, limit=100, offset=0):
        stmt = select(TeamUpdate)
        if workspace_id is not None: stmt = stmt.where(TeamUpdate.workspace_id == workspace_id)
        if team_id is not None: stmt = stmt.where(TeamUpdate.team_id == team_id)
        if status is not None: stmt = stmt.where(TeamUpdate.status == status)
        return list(self.db.scalars(stmt.order_by(TeamUpdate.id).limit(limit).offset(offset)).all())
