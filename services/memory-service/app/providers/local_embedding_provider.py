from app.providers.base_embedding_provider import EmbeddingProvider
from app.providers.mock_embedding_provider import MockEmbeddingProvider


class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str) -> None:
        super().__init__(model_name)
        self._fallback = MockEmbeddingProvider(model_name=model_name)

    def embed_text(self, text: str) -> list[float]:
        # TODO: Replace with a local embedding model once dependencies are selected.
        return self._fallback.embed_text(text)
