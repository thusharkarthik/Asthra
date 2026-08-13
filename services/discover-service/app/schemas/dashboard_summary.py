from pydantic import BaseModel


class DiscoverDashboardSummaryRead(BaseModel):
    id: int
    workspace_id: int
    total_ideas: int
    reviewing: int
    validating: int
    approved: int
    rejected: int
    converted_to_work: int

    model_config = {"from_attributes": True}
