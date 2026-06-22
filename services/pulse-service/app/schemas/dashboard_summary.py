from pydantic import BaseModel


class PulseDashboardSummaryRead(BaseModel):
    id: int
    workspace_id: int
    active_incidents: int
    sev1_count: int
    sev2_count: int
    resolved_incidents: int

    model_config = {"from_attributes": True}
