from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class BoardCreate(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class BoardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class BoardRead(TimestampedRead):
    project_id: int
    name: str
    description: str | None = None
    is_active: bool


class BoardColumnCreate(BaseModel):
    status_id: int | None = None
    name: str = Field(min_length=1, max_length=255)
    sort_order: int = 0
    work_in_progress_limit: int | None = None


class BoardColumnUpdate(BaseModel):
    status_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    sort_order: int | None = None
    work_in_progress_limit: int | None = None
    is_active: bool | None = None


class BoardColumnRead(TimestampedRead):
    board_id: int
    status_id: int | None = None
    name: str
    sort_order: int
    work_in_progress_limit: int | None = None
    is_active: bool
