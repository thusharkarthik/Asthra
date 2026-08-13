from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    limit: int = Field(default=100, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class PaginationMeta(BaseModel):
    limit: int
    offset: int
    count: int | None = None
    total: int | None = None
    has_next: bool | None = None
    has_previous: bool | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    pagination: PaginationMeta
    message: str | None = None
    request_id: str | None = None
