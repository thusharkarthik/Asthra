from sqlalchemy import select

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.ai_provider import AIProvider
from app.models.prompt_template import PromptTemplate


DEFAULT_PROVIDERS = [
    {
        "name": "openrouter",
        "provider_type": "openrouter",
        "base_url": "https://openrouter.ai/api/v1",
        "model_name": "openai/gpt-4o-mini",
        "is_active": True,
    },
    {
        "name": "groq",
        "provider_type": "groq",
        "base_url": "https://api.groq.com/openai/v1",
        "model_name": "llama-3.1-8b-instant",
        "is_active": True,
    },
]

DEFAULT_PROMPTS = [
    {
        "name": "Concise assistant",
        "category": "general",
        "system_prompt": "You are concise, practical, and clear.",
    },
    {
        "name": "Engineering reviewer",
        "category": "engineering",
        "system_prompt": "Review engineering work for clarity, risk, and testability.",
    },
    {
        "name": "Docs summarizer",
        "category": "docs",
        "system_prompt": "Summarize documentation clearly without adding unsupported claims.",
    },
]


def seed_providers() -> int:
    created = 0
    with SessionLocal() as db:
        for provider_data in DEFAULT_PROVIDERS:
            existing = db.scalars(
                select(AIProvider).where(AIProvider.name == provider_data["name"]),
            ).first()
            if existing is not None:
                continue
            db.add(AIProvider(**provider_data))
            created += 1
        db.commit()
    return created


def seed_prompts() -> int:
    created = 0
    with SessionLocal() as db:
        for prompt_data in DEFAULT_PROMPTS:
            existing = db.scalars(
                select(PromptTemplate).where(
                    PromptTemplate.name == prompt_data["name"],
                    PromptTemplate.category == prompt_data["category"],
                ),
            ).first()
            if existing is not None:
                continue
            db.add(PromptTemplate(**prompt_data))
            created += 1
        db.commit()
    return created


def main() -> None:
    Base.metadata.create_all(bind=engine)
    provider_count = seed_providers()
    prompt_count = seed_prompts()
    print(f"Seeded {provider_count} providers and {prompt_count} prompt templates.")


if __name__ == "__main__":
    main()
