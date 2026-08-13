from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class EscalationCreate(BaseModel):
    level: str = Field(default="team", min_length=1, max_length=50)
    reason: str = Field(min_length=1)
    escalated_to_id: int | None = None


class EscalationRead(TimestampedRead):
    ticket_id: int
    level: str
    reason: str
    escalated_to_id: int | None = None
