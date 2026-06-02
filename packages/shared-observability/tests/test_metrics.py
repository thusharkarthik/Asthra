from shared_observability import MetricRecorder


def test_metric_recorder():
    recorder = MetricRecorder()

    assert recorder.increment("requests_total") == 1
    assert recorder.increment("requests_total", 2) == 3
    assert recorder.set_gauge("queue_depth", 4.0) == 4.0
    assert recorder.snapshot()["counters"]["requests_total"] == 3
