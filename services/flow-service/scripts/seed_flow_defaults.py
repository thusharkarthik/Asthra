from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.models.audit_event import AuditEvent  # noqa: E402
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue  # noqa: E402
from app.models.linked_entity import LinkedEntity  # noqa: E402
from app.models.release import Release  # noqa: E402
from app.models.saved_view import SavedView  # noqa: E402
from app.models.sprint import Sprint  # noqa: E402
from app.models.team_capacity import TeamCapacity  # noqa: E402
from app.models.work_item import WorkItem  # noqa: E402
from app.models.work_item_attachment import WorkItemAttachment  # noqa: E402
from app.models.work_item_comment import WorkItemComment  # noqa: E402
from app.models.work_item_label import WorkItemLabel  # noqa: E402
from app.models.work_item_priority import WorkItemPriority  # noqa: E402
from app.models.work_item_relation import WorkItemRelation  # noqa: E402
from app.models.work_item_status import WorkItemStatus  # noqa: E402
from app.models.work_item_type import WorkItemType  # noqa: E402
from app.models.workflow import Workflow, WorkflowTransition  # noqa: E402


PROJECT_ID = int(os.getenv("FLOW_DEMO_PROJECT_ID", "3"))
WORKSPACE_ID = int(os.getenv("FLOW_DEMO_WORKSPACE_ID", "2"))
REPORTER_ID = int(os.getenv("FLOW_DEMO_REPORTER_ID", "1"))

DEFAULT_TYPES = [
    {"name": "task", "description": "General execution work.", "icon": "check-square"},
    {"name": "bug", "description": "Defect or regression.", "icon": "bug"},
    {"name": "feature", "description": "User-facing product work.", "icon": "sparkles"},
    {"name": "research", "description": "Discovery or technical research.", "icon": "search"},
    {"name": "incident", "description": "Operational incident follow-up.", "icon": "alert-triangle"},
]

DEFAULT_PRIORITIES = [
    {"name": "low", "description": "Low urgency.", "level": 1},
    {"name": "medium", "description": "Normal urgency.", "level": 2},
    {"name": "high", "description": "High urgency.", "level": 3},
    {"name": "critical", "description": "Critical urgency.", "level": 4},
]

WORKFLOW_STATUSES = [
    ("Todo", "todo", "backlog"),
    ("In Progress", "in_progress", "active"),
    ("Review", "review", "review"),
    ("Done", "done", "completed"),
]

WORKFLOW_TRANSITIONS = [("todo", "in_progress"), ("in_progress", "review"), ("review", "done"), ("done", "todo")]


def upsert_by_name(db, model, values: list[dict]) -> dict[str, object]:
    records = {}
    for value in values:
        record = db.query(model).filter(model.name == value["name"]).first()
        if record is None:
            record = model(**value)
            db.add(record)
            db.flush()
        else:
            for field, field_value in value.items():
                setattr(record, field, field_value)
        records[value["name"]] = record
    return records


def ensure_workflow(db) -> tuple[Workflow, dict[str, WorkItemStatus]]:
    workflow = (
        db.query(Workflow)
        .filter(Workflow.project_id == PROJECT_ID, Workflow.name == "Flow Demo Workflow")
        .first()
    )
    if workflow is None:
        workflow = Workflow(
            project_id=PROJECT_ID,
            workspace_id=WORKSPACE_ID,
            name="Flow Demo Workflow",
            description="Demo workflow for product and engineering execution.",
            is_default=True,
        )
        db.add(workflow)
        db.flush()

    statuses: dict[str, WorkItemStatus] = {}
    for index, (name, key, category) in enumerate(WORKFLOW_STATUSES):
        status = (
            db.query(WorkItemStatus)
            .filter(WorkItemStatus.workflow_id == workflow.id, WorkItemStatus.key == key)
            .first()
        )
        if status is None:
            status = WorkItemStatus(
                workflow_id=workflow.id,
                name=name,
                key=key,
                category=category,
                sort_order=index,
                is_active=True,
            )
            db.add(status)
            db.flush()
        else:
            status.name = name
            status.category = category
            status.sort_order = index
            status.is_active = True
        statuses[key] = status

    for from_key, to_key in WORKFLOW_TRANSITIONS:
        exists = (
            db.query(WorkflowTransition)
            .filter(
                WorkflowTransition.workflow_id == workflow.id,
                WorkflowTransition.from_status_id == statuses[from_key].id,
                WorkflowTransition.to_status_id == statuses[to_key].id,
            )
            .first()
        )
        if exists is None:
            db.add(
                WorkflowTransition(
                    workflow_id=workflow.id,
                    from_status_id=statuses[from_key].id,
                    to_status_id=statuses[to_key].id,
                )
            )
    return workflow, statuses


def ensure_labels(db) -> dict[str, WorkItemLabel]:
    labels = {
        "Frontend": "#0ea5e9",
        "Backend": "#22c55e",
        "Customer Impact": "#f97316",
        "Risk": "#ef4444",
        "Docs": "#8b5cf6",
    }
    records = {}
    for name, color in labels.items():
        record = (
            db.query(WorkItemLabel)
            .filter(WorkItemLabel.project_id == PROJECT_ID, WorkItemLabel.name == name)
            .first()
        )
        if record is None:
            record = WorkItemLabel(project_id=PROJECT_ID, name=name, color=color)
            db.add(record)
            db.flush()
        else:
            record.color = color
            record.is_active = True
        records[name] = record
    return records


def ensure_sprint_release(db) -> tuple[Sprint, Release]:
    now = datetime.now(timezone.utc)
    sprint = db.query(Sprint).filter(Sprint.project_id == PROJECT_ID, Sprint.name == "Sprint 1 - Flow usability").first()
    if sprint is None:
        sprint = Sprint(
            project_id=PROJECT_ID,
            name="Sprint 1 - Flow usability",
            goal="Make Flow usable for CRUD testing and demos.",
            start_date=now - timedelta(days=3),
            end_date=now + timedelta(days=11),
            status="active",
        )
        db.add(sprint)
        db.flush()

    release = db.query(Release).filter(Release.project_id == PROJECT_ID, Release.version == "v0.2-demo").first()
    if release is None:
        release = Release(
            project_id=PROJECT_ID,
            name="Internal Alpha Demo",
            version="v0.2-demo",
            description="Demo-ready Flow release with work management coverage.",
            target_date=now + timedelta(days=21),
            status="active",
        )
        db.add(release)
        db.flush()
    return sprint, release


def ensure_custom_fields(db) -> dict[str, CustomFieldDefinition]:
    definitions = [
        {"name": "Customer Tier", "field_type": "select", "required": False, "options": ["Free", "Pro", "Enterprise"]},
        {"name": "Security Review", "field_type": "checkbox", "required": False, "options": None},
        {"name": "Rollout Date", "field_type": "date", "required": False, "options": None},
    ]
    records = {}
    for definition in definitions:
        record = (
            db.query(CustomFieldDefinition)
            .filter(CustomFieldDefinition.project_id == PROJECT_ID, CustomFieldDefinition.name == definition["name"])
            .first()
        )
        if record is None:
            record = CustomFieldDefinition(project_id=PROJECT_ID, **definition)
            db.add(record)
            db.flush()
        else:
            record.field_type = definition["field_type"]
            record.required = definition["required"]
            record.options = definition["options"]
        records[definition["name"]] = record
    return records


def ensure_work_item(db, *, title: str, type_id: int, status_id: int, priority_id: int, **values) -> WorkItem:
    record = db.query(WorkItem).filter(WorkItem.project_id == PROJECT_ID, WorkItem.title == title).first()
    payload = {
        "project_id": PROJECT_ID,
        "type_id": type_id,
        "status_id": status_id,
        "priority_id": priority_id,
        "reporter_id": REPORTER_ID,
        "is_active": True,
        **values,
    }
    if record is None:
        record = WorkItem(title=title, **payload)
        db.add(record)
        db.flush()
    else:
        for field, value in payload.items():
            setattr(record, field, value)
    return record


def ensure_comment(db, work_item: WorkItem, body: str) -> None:
    exists = db.query(WorkItemComment).filter(WorkItemComment.work_item_id == work_item.id, WorkItemComment.body == body).first()
    if exists is None:
        db.add(WorkItemComment(work_item_id=work_item.id, author_user_id=REPORTER_ID, body=body))


def ensure_attachment(db, work_item: WorkItem, file_name: str, file_type: str, file_size: int) -> None:
    exists = (
        db.query(WorkItemAttachment)
        .filter(WorkItemAttachment.work_item_id == work_item.id, WorkItemAttachment.file_name == file_name)
        .first()
    )
    if exists is None:
        db.add(
            WorkItemAttachment(
                work_item_id=work_item.id,
                file_name=file_name,
                file_url=f"/demo/flow/{file_name}",
                file_type=file_type,
                file_size=file_size,
                uploaded_by_id=REPORTER_ID,
            )
        )


def ensure_relation(db, source: WorkItem, target: WorkItem, relation_type: str, description: str) -> None:
    exists = (
        db.query(WorkItemRelation)
        .filter(
            WorkItemRelation.source_work_item_id == source.id,
            WorkItemRelation.target_work_item_id == target.id,
            WorkItemRelation.relation_type == relation_type,
        )
        .first()
    )
    if exists is None:
        db.add(
            WorkItemRelation(
                source_work_item_id=source.id,
                target_work_item_id=target.id,
                relation_type=relation_type,
                description=description,
                created_by_id=REPORTER_ID,
            )
        )


def ensure_link(db, work_item: WorkItem, entity_type: str, entity_id: str, entity_title: str, entity_url: str | None = None) -> None:
    exists = (
        db.query(LinkedEntity)
        .filter(
            LinkedEntity.work_item_id == work_item.id,
            LinkedEntity.entity_type == entity_type,
            LinkedEntity.entity_id == entity_id,
        )
        .first()
    )
    if exists is None:
        db.add(
            LinkedEntity(
                work_item_id=work_item.id,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_title=entity_title,
                entity_url=entity_url,
            )
        )


def ensure_audit(db, work_item: WorkItem, action: str, old_value: str | None, new_value: str | None) -> None:
    exists = (
        db.query(AuditEvent)
        .filter(AuditEvent.work_item_id == work_item.id, AuditEvent.action == action, AuditEvent.new_value == new_value)
        .first()
    )
    if exists is None:
        db.add(
            AuditEvent(
                workspace_id=WORKSPACE_ID,
                project_id=PROJECT_ID,
                work_item_id=work_item.id,
                entity_type="work_item",
                entity_id=str(work_item.id),
                action=action,
                actor_id=REPORTER_ID,
                actor_name="Demo Admin",
                old_value=old_value,
                new_value=new_value,
                metadata_json={"seeded": True},
            )
        )


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        types = upsert_by_name(db, WorkItemType, DEFAULT_TYPES)
        priorities = upsert_by_name(db, WorkItemPriority, DEFAULT_PRIORITIES)
        _, statuses = ensure_workflow(db)
        labels = ensure_labels(db)
        sprint, release = ensure_sprint_release(db)
        custom_fields = ensure_custom_fields(db)

        initiative = ensure_work_item(
            db,
            title="Improve Asthra onboarding",
            type_id=types["feature"].id,
            status_id=statuses["in_progress"].id,
            priority_id=priorities["high"].id,
            item_level="initiative",
            description="Create a guided first-run experience for new Asthra teams.",
            effort_size="XL",
            effort_score=13,
            business_value="high",
            risk_level="medium",
            complexity="high",
            sprint_id=sprint.id,
            release_id=release.id,
            assignee_id=2,
            original_estimate_minutes=2400,
            remaining_estimate_minutes=1500,
        )
        feature = ensure_work_item(
            db,
            title="Workspace setup checklist",
            type_id=types["feature"].id,
            status_id=statuses["review"].id,
            priority_id=priorities["high"].id,
            item_level="feature",
            parent_id=initiative.id,
            description="Help users create organization, workspace, and project context.",
            effort_size="L",
            effort_score=8,
            business_value="high",
            risk_level="low",
            complexity="medium",
            sprint_id=sprint.id,
            release_id=release.id,
            assignee_id=3,
            original_estimate_minutes=960,
            remaining_estimate_minutes=240,
        )
        work_item = ensure_work_item(
            db,
            title="Build guided Flow empty states",
            type_id=types["task"].id,
            status_id=statuses["in_progress"].id,
            priority_id=priorities["medium"].id,
            item_level="work_item",
            parent_id=feature.id,
            description="Replace generic empty states with setup guidance and clear create actions.",
            effort_size="M",
            effort_score=5,
            business_value="medium",
            risk_level="low",
            complexity="medium",
            sprint_id=sprint.id,
            release_id=release.id,
            assignee_id=2,
            original_estimate_minutes=480,
            remaining_estimate_minutes=180,
            acceptance_criteria="- Missing org/workspace/project states are clear.\n- Create actions are visible.\n- Flow dashboard has realistic cards.",
            definition_of_done="- Tests pass\n- Manual demo flow verified",
        )
        bug = ensure_work_item(
            db,
            title="Fix board status transition error",
            type_id=types["bug"].id,
            status_id=statuses["todo"].id,
            priority_id=priorities["critical"].id,
            item_level="work_item",
            parent_id=feature.id,
            description="Problem Summary:\nBoard move can fail when workflow defaults are missing.\n\nExpected Result:\nUsers can move cards between valid statuses.",
            effort_size="S",
            effort_score=3,
            business_value="high",
            risk_level="high",
            complexity="medium",
            sprint_id=sprint.id,
            release_id=release.id,
            assignee_id=4,
            original_estimate_minutes=300,
            remaining_estimate_minutes=300,
        )
        subtask = ensure_work_item(
            db,
            title="Write Flow create dialog regression test",
            type_id=types["task"].id,
            status_id=statuses["done"].id,
            priority_id=priorities["medium"].id,
            item_level="subtask",
            parent_id=work_item.id,
            description="Cover title-only work item creation and advanced field expansion.",
            effort_size="S",
            effort_score=2,
            business_value="medium",
            risk_level="low",
            complexity="low",
            sprint_id=sprint.id,
            release_id=release.id,
            assignee_id=2,
            original_estimate_minutes=180,
            remaining_estimate_minutes=0,
        )

        initiative.labels = [labels["Customer Impact"]]
        feature.labels = [labels["Frontend"], labels["Customer Impact"]]
        work_item.labels = [labels["Frontend"], labels["Docs"]]
        bug.labels = [labels["Risk"], labels["Backend"]]

        ensure_comment(db, work_item, "Demo note: verify this from the frontend after seeding.")
        ensure_comment(db, bug, "This is intentionally high priority so board filters have meaningful data.")
        ensure_attachment(db, work_item, "flow-empty-state-wireframe.pdf", "application/pdf", 482000)
        ensure_attachment(db, bug, "status-transition-error.txt", "text/plain", 4200)
        ensure_relation(db, bug, work_item, "blocks", "Status transition stability blocks the demo checklist.")
        ensure_link(db, work_item, "doc_page", "docs-flow-setup", "Flow setup guide", "/docs/pages/docs-flow-setup")
        ensure_link(db, work_item, "discover_idea", "idea-onboarding", "Guided onboarding idea", "/discover/ideas/idea-onboarding")
        ensure_link(db, bug, "pulse_incident", "incident-board-move", "Board move failure incident", "/pulse/incidents/incident-board-move")

        for definition, value in [
            (custom_fields["Customer Tier"], "Enterprise"),
            (custom_fields["Security Review"], "true"),
            (custom_fields["Rollout Date"], (datetime.now(timezone.utc) + timedelta(days=14)).date().isoformat()),
        ]:
            existing = (
                db.query(CustomFieldValue)
                .filter(CustomFieldValue.work_item_id == work_item.id, CustomFieldValue.custom_field_id == definition.id)
                .first()
            )
            if existing is None:
                db.add(CustomFieldValue(work_item_id=work_item.id, custom_field_id=definition.id, value=value))
            else:
                existing.value = value

        if db.query(TeamCapacity).filter(TeamCapacity.project_id == PROJECT_ID, TeamCapacity.sprint_id == sprint.id, TeamCapacity.user_id == 2).first() is None:
            db.add(TeamCapacity(project_id=PROJECT_ID, sprint_id=sprint.id, user_id=2, capacity_minutes=1800, notes="Demo owner capacity."))
        if db.query(SavedView).filter(SavedView.project_id == PROJECT_ID, SavedView.name == "High Risk Demo Work").first() is None:
            db.add(SavedView(workspace_id=WORKSPACE_ID, project_id=PROJECT_ID, name="High Risk Demo Work", filters={"risk_level": "high"}, is_default=False))

        ensure_audit(db, work_item, "work_item.created", None, work_item.title)
        ensure_audit(db, work_item, "status.changed", "Todo", "In Progress")
        ensure_audit(db, bug, "priority.changed", "High", "Critical")

        db.commit()
        print(
            "Seeded Flow demo data for "
            f"workspace {WORKSPACE_ID}, project {PROJECT_ID}: "
            "workflow, statuses, priorities, hierarchy, comments, labels, dependencies, "
            "sprint, release, custom fields, attachments, links, saved views, and audit examples."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
