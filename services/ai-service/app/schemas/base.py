from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReadBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int


class TimestampedRead(ReadBase):
    created_at: datetime
    updated_at: datetime
