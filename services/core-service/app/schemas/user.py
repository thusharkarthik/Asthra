from pydantic import BaseModel, EmailStr

from app.schemas.base import TimestampedRead


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str | None = None
    password: str


class UserRead(TimestampedRead):
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None
    job_title: str | None = None
    timezone: str | None = None
    locale: str | None = None
    is_active: bool
    is_superuser: bool


class UserProfileRead(UserRead):
    pass


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    job_title: str | None = None
    timezone: str | None = None
    locale: str | None = None
