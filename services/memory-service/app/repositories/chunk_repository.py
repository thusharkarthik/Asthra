from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk


class ChunkRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def replace_document_chunks(self, *, document_id: int, chunks: list[str]) -> list[DocumentChunk]:
        self.db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
        self.db.commit()
        self.db.expire_all()
        chunk_records = [
            DocumentChunk(
                document_id=document_id,
                chunk_index=index,
                content=content,
                token_count=len(content.split()),
                metadata_={"strategy": "word_window"},
            )
            for index, content in enumerate(chunks)
        ]
        self.db.add_all(chunk_records)
        self.db.commit()
        for chunk in chunk_records:
            self.db.refresh(chunk)
        return chunk_records

    def list_by_document(self, document_id: int) -> list[DocumentChunk]:
        statement = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
        )
        return list(self.db.scalars(statement).all())

    def delete_by_document(self, document_id: int) -> None:
        self.db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
        self.db.commit()
