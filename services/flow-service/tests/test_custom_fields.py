import pytest
from fastapi import HTTPException

from app.schemas.custom_field import CustomFieldDefinitionCreate, CustomFieldDefinitionUpdate, CustomFieldValueUpsert
from app.schemas.work_item import WorkItemCreate
from app.services.custom_field_service import CustomFieldService
from app.services.work_item_service import WorkItemService


def test_custom_field_definition_crud(db):
    service = CustomFieldService(db)
    definition = service.create_definition(
        CustomFieldDefinitionCreate(
            project_id=42,
            name="Customer Tier",
            field_type="select",
            required=True,
            options=["Free", "Pro"],
        )
    )

    assert definition.id is not None
    assert definition.project_id == 42
    assert definition.options == ["Free", "Pro"]
    assert [field.id for field in service.list_definitions(project_id=42)] == [definition.id]

    updated = service.update_definition(definition.id, CustomFieldDefinitionUpdate(name="Account Tier", required=False))
    assert updated.name == "Account Tier"
    assert updated.required is False

    service.delete_definition(definition.id)
    assert service.list_definitions(project_id=42) == []


def test_custom_field_values_validate_required_and_select_options(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    custom_field_service = CustomFieldService(db)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=42, title="Custom field work"))
    definition = custom_field_service.create_definition(
        CustomFieldDefinitionCreate(
            project_id=42,
            name="Customer Tier",
            field_type="select",
            required=True,
            options=["Free", "Pro"],
        )
    )

    with pytest.raises(HTTPException) as required_error:
        custom_field_service.save_value(work_item.id, CustomFieldValueUpsert(custom_field_id=definition.id, value=""))
    assert required_error.value.status_code == 400

    with pytest.raises(HTTPException) as option_error:
        custom_field_service.save_value(work_item.id, CustomFieldValueUpsert(custom_field_id=definition.id, value="Enterprise"))
    assert option_error.value.status_code == 400

    saved = custom_field_service.save_value(work_item.id, CustomFieldValueUpsert(custom_field_id=definition.id, value="Pro"))
    assert saved.value == "Pro"
    assert custom_field_service.list_values(work_item.id)[0].value == "Pro"


def test_custom_field_value_must_match_work_item_project(db, monkeypatch):
    monkeypatch.setattr("app.services.work_item_service.publish_event", lambda *args, **kwargs: None)
    custom_field_service = CustomFieldService(db)
    work_item = WorkItemService(db).create(WorkItemCreate(project_id=1, title="Project scoped work"))
    definition = custom_field_service.create_definition(
        CustomFieldDefinitionCreate(project_id=2, name="External", field_type="text")
    )

    with pytest.raises(HTTPException) as exc:
        custom_field_service.save_value(work_item.id, CustomFieldValueUpsert(custom_field_id=definition.id, value="Nope"))

    assert exc.value.status_code == 400
