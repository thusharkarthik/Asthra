from uuid import UUID

from shared_utils import generate_uuid


def test_generate_uuid():
    assert UUID(generate_uuid())
