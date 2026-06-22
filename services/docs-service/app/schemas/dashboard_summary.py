from app.schemas.base import TimestampedRead


class DocsDashboardSummaryRead(TimestampedRead):
    workspace_id: int
    total_spaces: int
    total_pages: int
    draft_pages: int
    published_pages: int
