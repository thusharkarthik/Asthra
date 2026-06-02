import pytest

from shared_config import get_bool_env, get_env, get_int_env, get_list_env


def test_get_env(monkeypatch):
    monkeypatch.setenv("ASTHRA_TEST_VALUE", "value")

    assert get_env("ASTHRA_TEST_VALUE") == "value"
    assert get_env("MISSING_VALUE", default="fallback") == "fallback"


def test_required_env_failure(monkeypatch):
    monkeypatch.delenv("ASTHRA_REQUIRED_VALUE", raising=False)

    with pytest.raises(RuntimeError):
        get_env("ASTHRA_REQUIRED_VALUE", required=True)


def test_bool_env(monkeypatch):
    monkeypatch.setenv("ASTHRA_BOOL_TRUE", "true")
    monkeypatch.setenv("ASTHRA_BOOL_FALSE", "0")

    assert get_bool_env("ASTHRA_BOOL_TRUE") is True
    assert get_bool_env("ASTHRA_BOOL_FALSE") is False
    assert get_bool_env("ASTHRA_BOOL_MISSING", default=True) is True


def test_int_env(monkeypatch):
    monkeypatch.setenv("ASTHRA_INT", "42")
    monkeypatch.setenv("ASTHRA_BAD_INT", "bad")

    assert get_int_env("ASTHRA_INT") == 42
    assert get_int_env("ASTHRA_BAD_INT", default=7) == 7
    assert get_int_env("ASTHRA_MISSING_INT", default=3) == 3


def test_list_env(monkeypatch):
    monkeypatch.setenv("ASTHRA_LIST", "one, two,,three")

    assert get_list_env("ASTHRA_LIST") == ["one", "two", "three"]
    assert get_list_env("ASTHRA_MISSING_LIST") == []
