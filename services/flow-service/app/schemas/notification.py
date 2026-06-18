from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FlowNotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int | None = None
    project_id: int | None = None
    user_id: int | None = None
    work_item_id: int | None = None
    notification_type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
