from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReadBase(BaseModel):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FullRead(ReadBase):
    updated_at: datetime


class ThreadCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    entity_type: str | None = None
    entity_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    status: str = "open"
    created_by_id: int


class ThreadUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = None


class ThreadRead(ThreadCreate, FullRead): pass


class MessageCreate(BaseModel):
    author_id: int | None = None
    content: str = Field(min_length=1)


class MessageUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1)


class MessageRead(MessageCreate, FullRead):
    thread_id: int


class MentionCreate(BaseModel):
    workspace_id: int
    mentioned_user_id: int
    actor_user_id: int | None = None
    entity_type: str
    entity_id: int


class MentionRead(MentionCreate, ReadBase): pass


class ReactionCreate(BaseModel):
    workspace_id: int
    user_id: int
    entity_type: str
    entity_id: int
    emoji: str = Field(min_length=1, max_length=50)


class ReactionRead(ReactionCreate, ReadBase): pass


class AnnouncementCreate(BaseModel):
    workspace_id: int
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    status: str = "draft"
    created_by_id: int


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    status: str | None = None


class AnnouncementRead(AnnouncementCreate, FullRead): pass


class ActivityCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    actor_user_id: int | None = None
    entity_type: str
    entity_id: int | None = None
    action: str
    description: str | None = None


class ActivityRead(ActivityCreate, ReadBase): pass


class TeamUpdateCreate(BaseModel):
    workspace_id: int
    team_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    status: str = "draft"
    created_by_id: int


class TeamUpdateUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    status: str | None = None


class TeamUpdateRead(TeamUpdateCreate, FullRead): pass
