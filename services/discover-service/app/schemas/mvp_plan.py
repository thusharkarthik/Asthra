from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class MVPPlanCreate(BaseModel):
    scope: str = Field(min_length=1)
    assumptions: str | None = None
    risks: str | None = None
    success_metrics: str | None = None


class MVPPlanUpdate(BaseModel):
    scope: str | None = Field(default=None, min_length=1)
    assumptions: str | None = None
    risks: str | None = None
    success_metrics: str | None = None


class MVPPlanRead(FullTimestampedRead):
    idea_id: int
    scope: str
    assumptions: str | None = None
    risks: str | None = None
    success_metrics: str | None = None
