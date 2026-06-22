from app.schemas.base import TimestampedRead


class FlowDashboardSummaryRead(TimestampedRead):
    project_id: int
    open_work_items: int
    in_progress_items: int
    blocked_items: int
    completed_items: int
    active_sprints: int
    active_releases: int
