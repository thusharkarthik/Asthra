from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue
from app.schemas.custom_field import (
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionRead,
    CustomFieldDefinitionUpdate,
    CustomFieldValueRead,
    CustomFieldValueUpsert,
)
from app.services.custom_field_service import CustomFieldService

router = APIRouter()
work_item_router = APIRouter()


def auth_placeholder() -> None:
    # TODO: Replace with Core Service JWT validation and project membership checks.
    return None


@router.post("", response_model=CustomFieldDefinitionRead, status_code=status.HTTP_201_CREATED)
def create_custom_field_definition(
    definition_create: CustomFieldDefinitionCreate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> CustomFieldDefinition:
    return CustomFieldService(db).create_definition(definition_create)


@router.get("", response_model=list[CustomFieldDefinitionRead])
def list_custom_field_definitions(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[CustomFieldDefinition]:
    return CustomFieldService(db).list_definitions(project_id=project_id)


@router.get("/{definition_id}", response_model=CustomFieldDefinitionRead)
def get_custom_field_definition(
    definition_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> CustomFieldDefinition:
    return CustomFieldService(db).get_definition(definition_id)


@router.patch("/{definition_id}", response_model=CustomFieldDefinitionRead)
def update_custom_field_definition(
    definition_id: int,
    definition_update: CustomFieldDefinitionUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> CustomFieldDefinition:
    return CustomFieldService(db).update_definition(definition_id, definition_update)


@router.delete("/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_field_definition(
    definition_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> Response:
    CustomFieldService(db).delete_definition(definition_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@work_item_router.post("/work-items/{work_item_id}/custom-fields", response_model=CustomFieldValueRead, status_code=status.HTTP_201_CREATED)
def save_custom_field_value(
    work_item_id: int,
    value_upsert: CustomFieldValueUpsert,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> CustomFieldValue:
    return CustomFieldService(db).save_value(work_item_id, value_upsert)


@work_item_router.get("/work-items/{work_item_id}/custom-fields", response_model=list[CustomFieldValueRead])
def list_custom_field_values(
    work_item_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(auth_placeholder),
) -> list[CustomFieldValue]:
    return CustomFieldService(db).list_values(work_item_id)
