# Flow Custom Fields

## Purpose

Flow custom fields let a project capture work item data that is specific to that team or process without changing the core work item model.

## Supported Types

- `text`
- `number`
- `select`
- `date`
- `checkbox`

Select fields require options. Required fields are validated when values are saved.

## Backend Model

`CustomFieldDefinition` is project scoped:

- `id`
- `project_id`
- `name`
- `field_type`
- `required`
- `options`
- `created_at`

`CustomFieldValue` is work-item scoped:

- `id`
- `work_item_id`
- `custom_field_id`
- `value`

Values are stored as strings for this MVP. Type validation happens in the Flow service.

## UI

Admins can configure fields at:

```text
/flow/settings/custom-fields
```

Work item detail pages render project custom fields dynamically and allow saving values.

## Current Gaps

- Custom fields do not appear in list filters yet.
- Bulk editing is not implemented.
- Values are stored as strings after validation.
- Field ordering and archived fields are not implemented yet.
