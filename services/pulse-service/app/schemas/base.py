from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TimestampedRead(BaseModel):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FullTimestampedRead(TimestampedRead):
    updated_at: datetime
