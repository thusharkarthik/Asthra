from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class IdeaCreate(BaseModel):
    workspace_id: int
    project_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    problem_statement: str | None = None
    target_users: str | None = None
    status: str = Field(default="new", min_length=1, max_length=50)
    created_by_id: int


class IdeaUpdate(BaseModel):
    project_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    problem_statement: str | None = None
    target_users: str | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)


class IdeaRead(FullTimestampedRead):
    workspace_id: int
    project_id: int | None = None
    title: str
    description: str
    problem_statement: str | None = None
    target_users: str | None = None
    status: str
    created_by_id: int
