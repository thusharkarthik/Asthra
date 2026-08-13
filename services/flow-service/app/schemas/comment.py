from pydantic import BaseModel, Field, model_validator

from app.schemas.base import TimestampedRead


class WorkItemCommentCreate(BaseModel):
    author_user_id: int | None = None
    body: str | None = Field(default=None, min_length=1)
    user_id: int | None = None
    content: str | None = Field(default=None, min_length=1)

    @model_validator(mode="before")
    @classmethod
    def normalize_ui_payload(cls, data):
        if isinstance(data, dict):
            normalized = dict(data)
            if normalized.get("body") is None and normalized.get("content") is not None:
                normalized["body"] = normalized["content"]
            if normalized.get("author_user_id") is None and normalized.get("user_id") is not None:
                normalized["author_user_id"] = normalized["user_id"]
            return normalized
        return data


class WorkItemCommentUpdate(BaseModel):
    body: str | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class WorkItemCommentRead(TimestampedRead):
    work_item_id: int
    author_user_id: int
    body: str
    is_active: bool
    user_id: int | None = None
    content: str | None = None
