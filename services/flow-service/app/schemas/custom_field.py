from datetime import datetime

from pydantic import BaseModel, Field, field_validator


ALLOWED_CUSTOM_FIELD_TYPES = {"text", "number", "select", "date", "checkbox"}


class CustomFieldDefinitionCreate(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=255)
    field_type: str
    required: bool = False
    options: list[str] | None = None

    @field_validator("field_type")
    @classmethod
    def validate_field_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_CUSTOM_FIELD_TYPES:
            allowed = ", ".join(sorted(ALLOWED_CUSTOM_FIELD_TYPES))
            raise ValueError(f"field_type must be one of: {allowed}")
        return normalized

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        normalized = [option.strip() for option in value if option.strip()]
        return normalized or None


class CustomFieldDefinitionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    field_type: str | None = None
    required: bool | None = None
    options: list[str] | None = None

    @field_validator("field_type")
    @classmethod
    def validate_field_type(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return CustomFieldDefinitionCreate.validate_field_type(value)

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: list[str] | None) -> list[str] | None:
        return CustomFieldDefinitionCreate.validate_options(value)


class CustomFieldDefinitionRead(BaseModel):
    id: int
    project_id: int
    name: str
    field_type: str
    required: bool
    options: list[str] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomFieldValueUpsert(BaseModel):
    custom_field_id: int
    value: str | int | float | bool | None = None


class CustomFieldValueRead(BaseModel):
    id: int
    work_item_id: int
    custom_field_id: int
    value: str | None = None

    model_config = {"from_attributes": True}
