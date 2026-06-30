from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import TimestampedRead


class FeatureFlagRead(TimestampedRead):
    flag_key: str
    name: str
    description: str | None = None
    category: str
    default_enabled: bool
    is_system: bool
    is_active: bool


class FeatureFlagOverrideRead(TimestampedRead):
    flag_key: str
    scope_type: str
    scope_id: int | None = None
    enabled: bool
    reason: str | None = None
    created_by: int | None = None


class EffectiveFeatureFlagsRead(BaseModel):
    scope_type: str
    scope_id: int | None = None
    feature_flags: dict[str, bool]
    enabled_modules: list[str]
    generated_at: datetime


class FeatureFlagOverrideUpsert(BaseModel):
    flag_key: str = Field(min_length=1, max_length=150)
    scope_type: str = "platform"
    scope_id: int | None = None
    enabled: bool
    reason: str | None = None

    @field_validator("flag_key", "scope_type")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("Value is required.")
        return normalized


class FeatureFlagCatalogRead(BaseModel):
    flags: list[FeatureFlagRead]
    overrides: list[FeatureFlagOverrideRead]
