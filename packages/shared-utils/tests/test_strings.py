from shared_utils import normalize_text, slugify


def test_normalize_text():
    assert normalize_text("  hello   world  ") == "hello world"
    assert normalize_text(None) == ""


def test_slugify():
    assert slugify("Asthra Core Service") == "asthra-core-service"
    assert slugify("Hello, World!") == "hello-world"
