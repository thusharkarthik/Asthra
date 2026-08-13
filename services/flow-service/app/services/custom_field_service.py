from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.custom_field import CustomFieldDefinition, CustomFieldValue
from app.models.work_item import WorkItem
from app.schemas.custom_field import (
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionUpdate,
    CustomFieldValueUpsert,
)


class CustomFieldService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_definition(self, definition_create: CustomFieldDefinitionCreate) -> CustomFieldDefinition:
        self._validate_definition_options(definition_create.field_type, definition_create.options)
        definition = CustomFieldDefinition(**definition_create.model_dump())
        self.db.add(definition)
        self.db.commit()
        self.db.refresh(definition)
        return definition

    def list_definitions(self, project_id: int | None = None) -> list[CustomFieldDefinition]:
        statement = select(CustomFieldDefinition).order_by(CustomFieldDefinition.id)
        if project_id is not None:
            statement = statement.where(CustomFieldDefinition.project_id == project_id)
        return list(self.db.scalars(statement).all())

    def get_definition(self, definition_id: int) -> CustomFieldDefinition:
        definition = self.db.get(CustomFieldDefinition, definition_id)
        if definition is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom field definition not found.")
        return definition

    def update_definition(self, definition_id: int, definition_update: CustomFieldDefinitionUpdate) -> CustomFieldDefinition:
        definition = self.get_definition(definition_id)
        update_data = definition_update.model_dump(exclude_unset=True)
        field_type = update_data.get("field_type", definition.field_type)
        options = update_data.get("options", definition.options)
        self._validate_definition_options(field_type, options)
        for field, value in update_data.items():
            setattr(definition, field, value)
        self.db.add(definition)
        self.db.commit()
        self.db.refresh(definition)
        return definition

    def delete_definition(self, definition_id: int) -> None:
        definition = self.get_definition(definition_id)
        self.db.delete(definition)
        self.db.commit()

    def list_values(self, work_item_id: int) -> list[CustomFieldValue]:
        self._get_work_item(work_item_id)
        statement = select(CustomFieldValue).where(CustomFieldValue.work_item_id == work_item_id).order_by(CustomFieldValue.custom_field_id)
        return list(self.db.scalars(statement).all())

    def save_value(self, work_item_id: int, value_upsert: CustomFieldValueUpsert) -> CustomFieldValue:
        work_item = self._get_work_item(work_item_id)
        definition = self.get_definition(value_upsert.custom_field_id)
        if definition.project_id != work_item.project_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Custom field must belong to the work item project.")
        value = self._normalize_value(definition, value_upsert.value)
        statement = select(CustomFieldValue).where(
            CustomFieldValue.work_item_id == work_item_id,
            CustomFieldValue.custom_field_id == definition.id,
        )
        existing = self.db.scalars(statement).first()
        if existing is None:
            existing = CustomFieldValue(work_item_id=work_item_id, custom_field_id=definition.id, value=value)
        else:
            existing.value = value
        self.db.add(existing)
        self.db.commit()
        self.db.refresh(existing)
        return existing

    def _get_work_item(self, work_item_id: int) -> WorkItem:
        work_item = self.db.get(WorkItem, work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work item not found.")
        return work_item

    @staticmethod
    def _validate_definition_options(field_type: str, options: list[str] | None) -> None:
        if field_type == "select" and not options:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select custom fields require options.")

    @staticmethod
    def _normalize_value(definition: CustomFieldDefinition, raw_value: str | int | float | bool | None) -> str | None:
        if raw_value is None or raw_value == "":
            if definition.required:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{definition.name} is required.")
            return None
        if definition.field_type == "number":
            try:
                return str(float(raw_value))
            except (TypeError, ValueError) as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{definition.name} must be a number.") from exc
        if definition.field_type == "checkbox":
            if isinstance(raw_value, bool):
                return "true" if raw_value else "false"
            normalized = str(raw_value).strip().lower()
            if normalized not in {"true", "false"}:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{definition.name} must be true or false.")
            return normalized
        if definition.field_type == "date":
            try:
                datetime.fromisoformat(str(raw_value).replace("Z", "+00:00"))
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{definition.name} must be an ISO date.") from exc
            return str(raw_value)
        if definition.field_type == "select":
            value = str(raw_value)
            options = definition.options or []
            if value not in options:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{definition.name} must be one of: {', '.join(options)}.")
            return value
        return str(raw_value)
