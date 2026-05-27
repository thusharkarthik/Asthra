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
