from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class TeamCreate(BaseModel):
    workspace_id: int
    name: str
    slug: str


class TeamRead(TimestampedRead):
    workspace_id: int
    name: str
    slug: str


class TeamMemberCreate(BaseModel):
    team_id: int
    user_id: int
    role_id: int | None = None


class TeamMemberRead(TimestampedRead):
    team_id: int
    user_id: int
    role_id: int | None = None
