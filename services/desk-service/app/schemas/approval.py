from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class ApprovalCreate(BaseModel):
    approver_id: int | None = None
    status: str = Field(default="pending", min_length=1, max_length=50)
    note: str | None = None


class ApprovalUpdate(BaseModel):
    status: str | None = Field(default=None, min_length=1, max_length=50)
    note: str | None = None


class ApprovalRead(FullTimestampedRead):
    ticket_id: int
    approver_id: int | None = None
    status: str
    note: str | None = None
