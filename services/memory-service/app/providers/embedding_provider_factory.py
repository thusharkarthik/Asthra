from app.core.config import settings
from app.providers.base_embedding_provider import EmbeddingProvider
from app.providers.local_embedding_provider import LocalEmbeddingProvider
from app.providers.mock_embedding_provider import MockEmbeddingProvider


def get_embedding_provider() -> EmbeddingProvider:
    provider = settings.embedding_provider.strip().lower()
    if provider == "local":
        return LocalEmbeddingProvider(model_name=settings.embedding_model_name)
    return MockEmbeddingProvider(model_name=settings.embedding_model_name)
