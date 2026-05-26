from pydantic import BaseModel, EmailStr

from app.schemas.base import TimestampedRead


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str | None = None
    password: str


class UserRead(TimestampedRead):
    email: EmailStr
    full_name: str | None = None
    is_active: bool
