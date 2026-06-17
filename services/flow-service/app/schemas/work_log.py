from datetime import datetime

from pydantic import BaseModel, Field


class WorkLogCreate(BaseModel):
    user_id: int | None = None
    description: str | None = None
    time_spent_minutes: int = Field(gt=0)
    logged_at: datetime | None = None


class WorkLogRead(BaseModel):
    id: int
    work_item_id: int
    user_id: int | None = None
    description: str | None = None
    time_spent_minutes: int
    logged_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
