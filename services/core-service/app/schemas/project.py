from pydantic import BaseModel

from app.schemas.base import TimestampedRead


class ProjectCreate(BaseModel):
    workspace_id: int
    team_id: int | None = None
    name: str
    key: str
    description: str | None = None


class ProjectRead(TimestampedRead):
    workspace_id: int
    team_id: int | None = None
    name: str
    key: str
    description: str | None = None
