from pydantic import BaseModel, Field

from app.schemas.base import FullTimestampedRead


class ImpactScoreCreate(BaseModel):
    impact: float = Field(default=0, ge=0)
    effort: float = Field(default=0, ge=0)
    confidence: float = Field(default=0, ge=0)
    reach: float = Field(default=0, ge=0)


class ImpactScoreRead(FullTimestampedRead):
    idea_id: int
    impact: float
    effort: float
    confidence: float
    reach: float
    total_score: float
