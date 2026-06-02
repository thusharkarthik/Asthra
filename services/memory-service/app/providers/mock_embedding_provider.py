import hashlib
import math

from app.providers.base_embedding_provider import EmbeddingProvider


class MockEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str, dimensions: int = 16) -> None:
        super().__init__(model_name)
        self.dimensions = dimensions

    def embed_text(self, text: str) -> list[float]:
        seed = hashlib.sha256(text.encode("utf-8")).digest()
        values = [((seed[index % len(seed)] / 255.0) * 2.0) - 1.0 for index in range(self.dimensions)]
        norm = math.sqrt(sum(value * value for value in values)) or 1.0
        return [round(value / norm, 6) for value in values]
