import math
from typing import Any

from app.vectorstores.base_vector_store import VectorSearchResult, VectorStore


class InMemoryVectorStore(VectorStore):
    def __init__(self) -> None:
        self._vectors: dict[int, tuple[list[float], dict[str, Any]]] = {}

    def upsert_vector(self, chunk_id: int, vector: list[float], metadata: dict[str, Any]) -> str:
        self._vectors[chunk_id] = (vector, metadata)
        return f"in-memory:{chunk_id}"

    def search(
        self,
        query_vector: list[float],
        top_k: int,
        filters: dict[str, Any] | None = None,
    ) -> list[VectorSearchResult]:
        filters = {key: value for key, value in (filters or {}).items() if value is not None}
        results: list[VectorSearchResult] = []
        for chunk_id, (vector, metadata) in self._vectors.items():
            if not self._matches_filters(metadata, filters):
                continue
            results.append(
                VectorSearchResult(
                    chunk_id=chunk_id,
                    score=self._cosine_similarity(query_vector, vector),
                    metadata=metadata,
                ),
            )
        return sorted(results, key=lambda result: result.score, reverse=True)[:top_k]

    def delete_vector(self, chunk_id: int) -> None:
        self._vectors.pop(chunk_id, None)

    def clear(self) -> None:
        self._vectors.clear()

    def _matches_filters(self, metadata: dict[str, Any], filters: dict[str, Any]) -> bool:
        return all(metadata.get(key) == value for key, value in filters.items())

    def _cosine_similarity(self, left: list[float], right: list[float]) -> float:
        if not left or not right:
            return 0.0
        length = min(len(left), len(right))
        dot = sum(left[index] * right[index] for index in range(length))
        left_norm = math.sqrt(sum(value * value for value in left[:length]))
        right_norm = math.sqrt(sum(value * value for value in right[:length]))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return round(dot / (left_norm * right_norm), 6)


_VECTOR_STORE = InMemoryVectorStore()


def get_vector_store() -> InMemoryVectorStore:
    return _VECTOR_STORE
