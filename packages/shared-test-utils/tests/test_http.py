from shared_test_utils import build_dummy_auth_header


def test_dummy_auth_header_builder():
    assert build_dummy_auth_header() == {"Authorization": "Bearer test-token"}
    assert build_dummy_auth_header("abc") == {"Authorization": "Bearer abc"}
