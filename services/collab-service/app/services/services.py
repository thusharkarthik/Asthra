from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.repositories import ActivityRepo, AnnouncementRepo, MentionRepo, MessageRepo, ReactionRepo, TeamUpdateRepo, ThreadRepo


def nf(name): raise HTTPException(status_code=404, detail=f"{name} not found.")


class ThreadService:
    def __init__(self, db: Session): self.repo = ThreadRepo(db)
    def create(self, d): return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Thread")
        return x
    def update(self, i, d): return self.repo.update(self.get(i), d)
    def delete(self, i): self.repo.delete(self.get(i))
    # TODO: Add AI conversation summaries and discussion extraction later.


class MessageService:
    def __init__(self, db: Session): self.repo = MessageRepo(db); self.threads = ThreadService(db)
    def create(self, tid, d): self.threads.get(tid); return self.repo.create_for_thread(tid, d)
    def list(self, tid): self.threads.get(tid); return self.repo.list_by_thread(tid)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Message")
        return x
    def update(self, i, d): return self.repo.update(self.get(i), d)
    def delete(self, i): self.repo.delete(self.get(i))


class MentionService:
    def __init__(self, db: Session): self.repo = MentionRepo(db)
    def create(self, d): return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)


class ReactionService:
    def __init__(self, db: Session): self.repo = ReactionRepo(db)
    def create(self, d):
        duplicate = self.repo.find_duplicate(d)
        if duplicate is not None: raise HTTPException(status_code=400, detail="Duplicate reaction.")
        return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def delete(self, i):
        x = self.repo.get(i)
        if x is None: nf("Reaction")
        self.repo.delete(x)


class AnnouncementService:
    def __init__(self, db: Session): self.repo = AnnouncementRepo(db)
    def create(self, d): return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Announcement")
        return x
    def update(self, i, d): return self.repo.update(self.get(i), d)
    def delete(self, i): self.repo.delete(self.get(i))
    # TODO: Add AI follow-up generation later.


class ActivityService:
    def __init__(self, db: Session): self.repo = ActivityRepo(db)
    def create(self, d): return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)


class TeamUpdateService:
    def __init__(self, db: Session): self.repo = TeamUpdateRepo(db)
    def create(self, d): return self.repo.create(d)
    def list(self, **f): return self.repo.list(**f)
    def get(self, i):
        x = self.repo.get(i)
        if x is None: nf("Team update")
        return x
    def update(self, i, d): return self.repo.update(self.get(i), d)
    def delete(self, i): self.repo.delete(self.get(i))
    # TODO: Add AI meeting summaries and follow-up generation later.
