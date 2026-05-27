import os
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./tests/test_asthra_intelligence.db"
os.environ["ENVIRONMENT"] = "test"

from app.db.base import Base  # noqa: E402
from app.models.ai_provider import AIProvider  # noqa: E402
from app.models.prompt_template import PromptTemplate  # noqa: E402
from app.schemas.conversation import ConversationCreate  # noqa: E402
from app.schemas.prompt import PromptTemplateCreate  # noqa: E402
from app.services.conversation_service import ConversationService  # noqa: E402
from app.services.prompt_service import PromptService  # noqa: E402


TEST_DB_PATH = Path(__file__).parent / "test_asthra_intelligence.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def create_provider(
    db: Session,
    *,
    name: str = "openrouter",
    provider_type: str = "openrouter",
    model_name: str = "openai/gpt-4o-mini",
    base_url: str = "https://openrouter.ai/api/v1",
) -> AIProvider:
    provider = AIProvider(
        name=name,
        provider_type=provider_type,
        base_url=base_url,
        model_name=model_name,
        is_active=True,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


def create_prompt(
    db: Session,
    *,
    name: str = "Concise assistant",
    category: str = "general",
    system_prompt: str = "You are concise and practical.",
) -> PromptTemplate:
    return PromptService(db).create(
        PromptTemplateCreate(
            name=name,
            category=category,
            system_prompt=system_prompt,
        ),
    )


def create_conversation(
    db: Session,
    *,
    workspace_id: int = 1,
    user_id: int = 1,
    title: str = "Planning discussion",
):
    return ConversationService(db).create(
        ConversationCreate(
            workspace_id=workspace_id,
            user_id=user_id,
            title=title,
        ),
    )
