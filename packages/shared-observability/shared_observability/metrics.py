from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class MetricRecorder:
    counters: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    gauges: dict[str, float] = field(default_factory=dict)

    def increment(self, name: str, value: int = 1) -> int:
        self.counters[name] += value
        return self.counters[name]

    def set_gauge(self, name: str, value: float) -> float:
        self.gauges[name] = value
        return value

    def snapshot(self) -> dict:
        return {"counters": dict(self.counters), "gauges": dict(self.gauges)}
