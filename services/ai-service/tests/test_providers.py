import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services.provider_service import ProviderService

from .conftest import create_provider


def test_resolve_provider_uses_active_database_provider(db, monkeypatch):
    create_provider(db)
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")

    resolved = ProviderService(db).resolve_provider(
        provider_name="openrouter",
        model_name=None,
    )

    assert resolved.record.provider_type == "openrouter"
    assert resolved.adapter.model_name == "openai/gpt-4o-mini"


def test_resolve_provider_rejects_unknown_provider(db):
    with pytest.raises(HTTPException) as exc_info:
        ProviderService(db).resolve_provider(
            provider_name="unknown",
            model_name=None,
        )

    assert exc_info.value.status_code == 400
