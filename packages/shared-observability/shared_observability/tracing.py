from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4


@dataclass
class TraceSpan:
    name: str
    trace_id: str = field(default_factory=lambda: str(uuid4()))
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: datetime | None = None
    attributes: dict | None = None

    def finish(self) -> "TraceSpan":
        self.ended_at = datetime.now(timezone.utc)
        return self


def start_trace_span(name: str, attributes: dict | None = None) -> TraceSpan:
    return TraceSpan(name=name, attributes=attributes or {})
