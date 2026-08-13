import base64
import json

import pytest

from shared_auth.jwt_utils import decode_jwt_without_verification, extract_claims, extract_subject


def _encode_segment(data: dict) -> str:
    raw = json.dumps(data, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _token(claims: dict) -> str:
    return f"{_encode_segment({'alg': 'none'})}.{_encode_segment(claims)}.signature"


def test_decode_jwt_without_verification():
    token = _token({"sub": "123", "email": "user@example.com"})

    claims = decode_jwt_without_verification(token)

    assert claims["sub"] == "123"
    assert claims["email"] == "user@example.com"
    assert extract_claims(token)["sub"] == "123"
    assert extract_subject(token) == "123"


def test_decode_malformed_jwt():
    with pytest.raises(ValueError):
        decode_jwt_without_verification("not-a-jwt")
