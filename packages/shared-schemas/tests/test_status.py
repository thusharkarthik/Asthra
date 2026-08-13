from shared_schemas import ActiveState, LifecycleStatus, PrioritySeverity, ProcessingStatus


def test_status_enums():
    assert ActiveState.ACTIVE == "active"
    assert ActiveState.INACTIVE == "inactive"
    assert LifecycleStatus.DRAFT == "draft"
    assert LifecycleStatus.ARCHIVED == "archived"
    assert ProcessingStatus.PENDING == "pending"
    assert ProcessingStatus.SUCCESS == "success"
    assert PrioritySeverity.LOW == "low"
    assert PrioritySeverity.CRITICAL == "critical"
