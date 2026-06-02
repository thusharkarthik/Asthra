from pydantic import BaseModel, Field

from app.schemas.base import TimestampedRead


class EmbeddingRecordCreate(BaseModel):
    chunk_id: int
    embedding_model: str = Field(min_length=1, max_length=255)
    vector_id: str | None = Field(default=None, max_length=1000)
    embedding_status: str = Field(default="pending", min_length=1, max_length=50)


class EmbeddingRecordRead(TimestampedRead):
    chunk_id: int
    embedding_model: str
    vector_id: str | None = None
    embedding_status: str


class EmbeddingGenerationResponse(BaseModel):
    document_id: int
    embedding_model: str
    status: str
    chunks_processed: int = 0
    embeddings_created: int = 0
    provider: str | None = None
    model: str | None = None
    records_created: int
    records_updated: int
    records: list[EmbeddingRecordRead]
