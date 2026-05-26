from app.db.session import SessionLocal
from app.models.work_item_priority import WorkItemPriority
from app.models.work_item_status import WorkItemStatus
from app.models.work_item_type import WorkItemType


DEFAULT_TYPES = [
    {"name": "task", "description": "General work item.", "icon": "check-square"},
    {"name": "bug", "description": "Defect or regression.", "icon": "bug"},
    {"name": "story", "description": "User-facing product work.", "icon": "book-open"},
    {"name": "epic", "description": "Large body of related work.", "icon": "layers"},
]

DEFAULT_STATUSES = [
    {"name": "todo", "description": "Not started.", "category": "todo", "sort_order": 0},
    {
        "name": "in_progress",
        "description": "Currently being worked on.",
        "category": "in_progress",
        "sort_order": 1,
    },
    {"name": "review", "description": "Ready for review.", "category": "review", "sort_order": 2},
    {"name": "done", "description": "Completed.", "category": "done", "sort_order": 3},
]

DEFAULT_PRIORITIES = [
    {"name": "low", "description": "Low urgency.", "level": 1},
    {"name": "medium", "description": "Normal urgency.", "level": 2},
    {"name": "high", "description": "High urgency.", "level": 3},
    {"name": "critical", "description": "Critical urgency.", "level": 4},
]


def upsert_model(db, model, defaults: list[dict]) -> int:
    created = 0
    for item in defaults:
        existing = db.query(model).filter(model.name == item["name"]).first()
        if existing is None:
            db.add(model(**item))
            created += 1
            continue
        for field, value in item.items():
            setattr(existing, field, value)
    db.commit()
    return created


def main() -> None:
    db = SessionLocal()
    try:
        type_count = upsert_model(db, WorkItemType, DEFAULT_TYPES)
        status_count = upsert_model(db, WorkItemStatus, DEFAULT_STATUSES)
        priority_count = upsert_model(db, WorkItemPriority, DEFAULT_PRIORITIES)
    finally:
        db.close()

    print(
        "Seeded Flow defaults: "
        f"{type_count} types, {status_count} statuses, {priority_count} priorities created.",
    )


if __name__ == "__main__":
    main()
