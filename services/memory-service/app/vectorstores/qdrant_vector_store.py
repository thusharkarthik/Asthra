from typing import Any

from app.vectorstores.base_vector_store import VectorSearchResult, VectorStore


class QdrantVectorStore(VectorStore):
    def upsert_vector(self, chunk_id: int, vector: list[float], metadata: dict[str, Any]) -> str:
        # TODO: Implement Qdrant integration after dependency and deployment choices are finalized.
        raise NotImplementedError("Qdrant vector store is a placeholder.")

    def search(
        self,
        query_vector: list[float],
        top_k: int,
        filters: dict[str, Any] | None = None,
    ) -> list[VectorSearchResult]:
        # TODO: Implement Qdrant search after Qdrant is introduced.
        raise NotImplementedError("Qdrant vector store is a placeholder.")

    def delete_vector(self, chunk_id: int) -> None:
        # TODO: Implement Qdrant deletion after Qdrant is introduced.
        raise NotImplementedError("Qdrant vector store is a placeholder.")
