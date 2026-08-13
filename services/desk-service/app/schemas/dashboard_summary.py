from pydantic import BaseModel


class DeskDashboardSummaryRead(BaseModel):
    id: int
    workspace_id: int
    open_tickets: int
    assigned_tickets: int
    in_progress_tickets: int
    resolved_tickets: int

    model_config = {"from_attributes": True}
