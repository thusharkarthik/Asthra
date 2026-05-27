import pytest
from fastapi import HTTPException

from app.schemas.prompt import PromptTemplateCreate, PromptTemplateUpdate
from app.services.prompt_service import PromptService


def test_prompt_template_crud(db):
    service = PromptService(db)

    prompt = service.create(
        PromptTemplateCreate(
            name="Concise assistant",
            category="general",
            system_prompt="You are concise and practical.",
        ),
    )
    assert prompt.id is not None

    prompts = service.list(category="general")
    assert [item.id for item in prompts] == [prompt.id]

    fetched = service.get(prompt.id)
    assert fetched.name == "Concise assistant"

    updated = service.update(
        prompt.id,
        PromptTemplateUpdate(system_prompt="You are clear and direct."),
    )
    assert updated.system_prompt == "You are clear and direct."

    service.delete(prompt.id)

    with pytest.raises(HTTPException) as exc_info:
        service.get(prompt.id)
    assert exc_info.value.status_code == 404
