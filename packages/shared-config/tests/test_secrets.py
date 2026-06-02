from shared_config import mask_secret


def test_mask_secret():
    assert mask_secret(None) is None
    assert mask_secret("") == ""
    assert mask_secret("abcd") == "****"
    assert mask_secret("secret-value") == "se********ue"
