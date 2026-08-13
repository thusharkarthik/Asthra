from uuid import UUID

from shared_test_utils import sample_email, sample_id, sample_uuid


def test_sample_factories():
    assert sample_id() == 1
    assert sample_email("alice") == "alice@example.com"
    assert UUID(sample_uuid())
