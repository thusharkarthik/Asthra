from app.schemas.base import TimestampedRead


class WorkspaceSummaryRead(TimestampedRead):
    organization_id: int
    workspace_count: int
    project_count: int
    member_count: int
    team_count: int


class ProjectSummaryRead(TimestampedRead):
    workspace_id: int
    project_count: int
    team_count: int
    member_count: int
