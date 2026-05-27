from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import *
from app.services.services import *

api_router = APIRouter()

@api_router.post("/threads", response_model=ThreadRead, status_code=201)
def create_thread(d: ThreadCreate, db: Session = Depends(get_db)): return ThreadService(db).create(d)
@api_router.get("/threads", response_model=list[ThreadRead])
def list_threads(workspace_id: int | None = None, project_id: int | None = None, entity_type: str | None = None, entity_id: int | None = None, created_by_id: int | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)): return ThreadService(db).list(workspace_id=workspace_id, project_id=project_id, entity_type=entity_type, entity_id=entity_id, created_by_id=created_by_id, limit=limit, offset=offset)
@api_router.get("/threads/{thread_id}", response_model=ThreadRead)
def get_thread(thread_id: int, db: Session = Depends(get_db)): return ThreadService(db).get(thread_id)
@api_router.patch("/threads/{thread_id}", response_model=ThreadRead)
def update_thread(thread_id: int, d: ThreadUpdate, db: Session = Depends(get_db)): return ThreadService(db).update(thread_id, d)
@api_router.delete("/threads/{thread_id}", status_code=204)
def delete_thread(thread_id: int, db: Session = Depends(get_db)): ThreadService(db).delete(thread_id); return Response(status_code=204)

@api_router.post("/threads/{thread_id}/messages", response_model=MessageRead, status_code=201)
def create_message(thread_id: int, d: MessageCreate, db: Session = Depends(get_db)): return MessageService(db).create(thread_id, d)
@api_router.get("/threads/{thread_id}/messages", response_model=list[MessageRead])
def list_messages(thread_id: int, db: Session = Depends(get_db)): return MessageService(db).list(thread_id)
@api_router.patch("/messages/{message_id}", response_model=MessageRead)
def update_message(message_id: int, d: MessageUpdate, db: Session = Depends(get_db)): return MessageService(db).update(message_id, d)
@api_router.delete("/messages/{message_id}", status_code=204)
def delete_message(message_id: int, db: Session = Depends(get_db)): MessageService(db).delete(message_id); return Response(status_code=204)

@api_router.post("/mentions", response_model=MentionRead, status_code=201)
def create_mention(d: MentionCreate, db: Session = Depends(get_db)): return MentionService(db).create(d)
@api_router.get("/mentions", response_model=list[MentionRead])
def list_mentions(workspace_id: int | None = None, mentioned_user_id: int | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)): return MentionService(db).list(workspace_id=workspace_id, mentioned_user_id=mentioned_user_id, limit=limit, offset=offset)

@api_router.post("/reactions", response_model=ReactionRead, status_code=201)
def create_reaction(d: ReactionCreate, db: Session = Depends(get_db)): return ReactionService(db).create(d)
@api_router.get("/reactions", response_model=list[ReactionRead])
def list_reactions(workspace_id: int | None = None, entity_type: str | None = None, entity_id: int | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)): return ReactionService(db).list(workspace_id=workspace_id, entity_type=entity_type, entity_id=entity_id, limit=limit, offset=offset)
@api_router.delete("/reactions/{reaction_id}", status_code=204)
def delete_reaction(reaction_id: int, db: Session = Depends(get_db)): ReactionService(db).delete(reaction_id); return Response(status_code=204)

@api_router.post("/announcements", response_model=AnnouncementRead, status_code=201)
def create_announcement(d: AnnouncementCreate, db: Session = Depends(get_db)): return AnnouncementService(db).create(d)
@api_router.get("/announcements", response_model=list[AnnouncementRead])
def list_announcements(workspace_id: int | None = None, created_by_id: int | None = None, status: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)): return AnnouncementService(db).list(workspace_id=workspace_id, created_by_id=created_by_id, status=status, limit=limit, offset=offset)
@api_router.get("/announcements/{announcement_id}", response_model=AnnouncementRead)
def get_announcement(announcement_id: int, db: Session = Depends(get_db)): return AnnouncementService(db).get(announcement_id)
@api_router.patch("/announcements/{announcement_id}", response_model=AnnouncementRead)
def update_announcement(announcement_id: int, d: AnnouncementUpdate, db: Session = Depends(get_db)): return AnnouncementService(db).update(announcement_id, d)
@api_router.delete("/announcements/{announcement_id}", status_code=204)
def delete_announcement(announcement_id: int, db: Session = Depends(get_db)): AnnouncementService(db).delete(announcement_id); return Response(status_code=204)

@api_router.post("/activity-stream", response_model=ActivityRead, status_code=201)
def create_activity(d: ActivityCreate, db: Session = Depends(get_db)): return ActivityService(db).create(d)
@api_router.get("/activity-stream", response_model=list[ActivityRead])
def list_activity(workspace_id: int | None = None, project_id: int | None = None, entity_type: str | None = None, actor_user_id: int | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)): return ActivityService(db).list(workspace_id=workspace_id, project_id=project_id, entity_type=entity_type, actor_user_id=actor_user_id, limit=limit, offset=offset)

@api_router.post("/team-updates", response_model=TeamUpdateRead, status_code=201)
def create_team_update(d: TeamUpdateCreate, db: Session = Depends(get_db)): return TeamUpdateService(db).create(d)
@api_router.get("/team-updates", response_model=list[TeamUpdateRead])
def list_team_updates(workspace_id: int | None = None, team_id: int | None = None, status: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db)): return TeamUpdateService(db).list(workspace_id=workspace_id, team_id=team_id, status=status, limit=limit, offset=offset)
@api_router.get("/team-updates/{team_update_id}", response_model=TeamUpdateRead)
def get_team_update(team_update_id: int, db: Session = Depends(get_db)): return TeamUpdateService(db).get(team_update_id)
@api_router.patch("/team-updates/{team_update_id}", response_model=TeamUpdateRead)
def update_team_update(team_update_id: int, d: TeamUpdateUpdate, db: Session = Depends(get_db)): return TeamUpdateService(db).update(team_update_id, d)
@api_router.delete("/team-updates/{team_update_id}", status_code=204)
def delete_team_update(team_update_id: int, db: Session = Depends(get_db)): TeamUpdateService(db).delete(team_update_id); return Response(status_code=204)
