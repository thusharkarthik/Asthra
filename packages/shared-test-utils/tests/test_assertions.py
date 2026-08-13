from shared_test_utils import assert_error_response, assert_success_response


def test_success_assertion():
    assert_success_response({"success": True, "data": {"id": 1}})


def test_error_assertion():
    assert_error_response({"success": False, "error": {"code": "bad", "message": "Bad"}})
