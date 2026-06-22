from datetime import datetime

from pydantic import BaseModel


class ContextVersionRead(BaseModel):
    user_id: int
    organization_id: int | None = None
    organization_version: int
    workspace_id: int | None = None
    workspace_version: int
    project_id: int | None = None
    project_version: int
    access_version: int
    generated_at: datetime
