from __future__ import annotations

from app.core.config import settings


class ChunkingService:
    def __init__(
        self,
        *,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> None:
        self.chunk_size = chunk_size or settings.memory_chunk_size
        self.chunk_overlap = chunk_overlap if chunk_overlap is not None else settings.memory_chunk_overlap
        if self.chunk_size < 1:
            self.chunk_size = 1
        if self.chunk_overlap < 0:
            self.chunk_overlap = 0
        if self.chunk_overlap >= self.chunk_size:
            self.chunk_overlap = max(0, self.chunk_size - 1)

    def chunk_text(self, content: str) -> list[str]:
        words = content.split()
        if not words:
            return []

        chunks: list[str] = []
        step = self.chunk_size - self.chunk_overlap
        start = 0
        while start < len(words):
            end = start + self.chunk_size
            chunks.append(" ".join(words[start:end]))
            if end >= len(words):
                break
            start += step
        return chunks
