from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(min_length=1, max_length=50)
    content: str = Field(min_length=1)


class ChatCompletionRequest(BaseModel):
    provider: str | None = None
    model: str | None = None
    system_prompt: str | None = None
    messages: list[ChatMessage] = Field(min_length=1)
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=1)


class TokenUsage(BaseModel):
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class ChatCompletionResponse(BaseModel):
    generated_text: str
    provider: str
    model: str
    usage: TokenUsage | None = None


class RAGCompletionRequest(BaseModel):
    query: str = Field(min_length=1)
    workspace_id: int | None = None
    memory_service_url: str | None = None
    top_k: int | None = Field(default=5, ge=1, le=20)
    provider: str | None = None
    model: str | None = None
    system_prompt: str | None = None


class RAGSourceChunk(BaseModel):
    chunk_id: int
    document_id: int
    document_title: str
    content: str
    source_id: int
    workspace_id: int | None = None
    score: float | None = None
    metadata: dict | None = None


class RAGCompletionResponse(BaseModel):
    answer: str
    sources: list[RAGSourceChunk]
    provider: str
    model: str
    retrieval_metadata: dict
    usage: TokenUsage | None = None
