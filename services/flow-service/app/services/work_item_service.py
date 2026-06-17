from __future__ import annotations

import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.repositories.work_item_repository import WorkItemRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.work_item import (
    LinkedEntityCreate,
    LinkedEntityRead,
    ProjectHierarchyRead,
    WorkItemAIBreakdownRead,
    WorkItemCreate,
    WorkItemHierarchyNode,
    WorkItemMemoryDocumentPayload,
    WorkItemParentUpdate,
    WorkItemRelationCreate,
    WorkItemRelationRead,
    WorkItemUpdate,
)
from app.services.ai_client import AIClient
from app.services.activity_service import ActivityService
from app.services.audit_service import AuditService
from app.services.automation_rule_service import AutomationRuleService
from app.services.event_publisher import publish_event
from app.services.notification_service import NotificationService
from app.services.workflow_service import WorkflowService

logger = logging.getLogger(__name__)


class WorkItemService:
    def __init__(self, db: Session) -> None:
        self.work_item_repository = WorkItemRepository(db)
        self.activity_service = ActivityService(db)
        self.audit_service = AuditService(db)
        self.notification_service = NotificationService(db)

    def create(self, work_item_create: WorkItemCreate) -> WorkItem:
        logger.info(
            "flow.work_item.create.received",
            extra={"payload": work_item_create.model_dump()},
        )
        work_item_create = self._apply_create_defaults(work_item_create)
        logger.info(
            "flow.work_item.create.defaults_resolved",
            extra={
                "type_id": work_item_create.type_id,
                "status_id": work_item_create.status_id,
                "priority_id": work_item_create.priority_id,
                "reporter_id": work_item_create.reporter_id,
            },
        )
        self._validate_required_ids(work_item_create.project_id)
        self._validate_references(
            type_id=work_item_create.type_id,
            status_id=work_item_create.status_id,
            priority_id=work_item_create.priority_id,
        )
        self._validate_board_linkage(
            project_id=work_item_create.project_id,
            board_id=work_item_create.board_id,
            board_column_id=work_item_create.board_column_id,
        )
        self._validate_hierarchy(
            item_level=work_item_create.item_level,
            parent_id=work_item_create.parent_id,
            project_id=work_item_create.project_id,
        )
        work_item = self.work_item_repository.create(work_item_create)
        self.activity_service.log_activity(
            action="work_item.created",
            entity_type="work_item",
            entity_id=str(work_item.id),
            actor_user_id=work_item.reporter_id,
            project_id=work_item.project_id,
            work_item_id=work_item.id,
            description=f"Work item '{work_item.title}' was created.",
        )
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="work_item",
                entity_id=str(work_item.id),
                action="work_item.created",
                actor_id=work_item.reporter_id,
                new_value=work_item.title,
                metadata={"title": work_item.title},
            )
        )
        publish_event(
            "flow.work_item.created",
            payload={"title": work_item.title, "project_id": work_item.project_id},
            actor_user_id=work_item.reporter_id,
            entity_type="work_item",
            entity_id=str(work_item.id),
        )
        AutomationRuleService(self.work_item_repository.db).execute_for_event(
            "work_item_created",
            work_item,
            event_payload={"title": work_item.title, "project_id": work_item.project_id},
        )
        return work_item

    def list(
        self,
        *,
        status_id: int | None = None,
        assignee_id: int | None = None,
        project_id: int | None = None,
        priority_id: int | None = None,
        sprint_id: int | None = None,
        release_id: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[WorkItem]:
        return self.work_item_repository.list(
            status_id=status_id,
            assignee_id=assignee_id,
            project_id=project_id,
            priority_id=priority_id,
            sprint_id=sprint_id,
            release_id=release_id,
            limit=limit,
            offset=offset,
        )

    def get(self, work_item_id: int) -> WorkItem:
        work_item = self.work_item_repository.get_by_id(work_item_id)
        if work_item is None or not work_item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item not found.",
            )
        return work_item

    def update(self, work_item_id: int, work_item_update: WorkItemUpdate) -> WorkItem:
        work_item = self.get(work_item_id)
        previous_status_id = work_item.status_id
        previous_priority_id = work_item.priority_id
        previous_assignee_id = work_item.assignee_id
        previous_due_date = work_item.due_date
        previous_title = work_item.title
        previous_description = work_item.description
        work_item_update = self._apply_update_lookup_names(work_item_update, work_item.project_id)
        effective_level = work_item_update.item_level if work_item_update.item_level is not None else work_item.item_level
        effective_parent_id = work_item_update.parent_id if "parent_id" in work_item_update.model_fields_set else work_item.parent_id
        self._validate_references(
            type_id=work_item_update.type_id,
            status_id=work_item_update.status_id,
            priority_id=work_item_update.priority_id,
        )
        self._validate_board_linkage(
            project_id=work_item.project_id,
            board_id=work_item_update.board_id,
            board_column_id=work_item_update.board_column_id,
        )
        self._validate_hierarchy(
            item_level=effective_level,
            parent_id=effective_parent_id,
            project_id=work_item.project_id,
            work_item_id=work_item.id,
        )
        if work_item_update.status_id is not None:
            WorkflowService(self.work_item_repository.db).validate_transition(work_item.project_id, work_item.status_id, work_item_update.status_id)
        updated_work_item = self.work_item_repository.update(work_item, work_item_update)
        self.activity_service.log_activity(
            action="work_item.updated",
            entity_type="work_item",
            entity_id=str(updated_work_item.id),
            actor_user_id=updated_work_item.reporter_id,
            project_id=updated_work_item.project_id,
            work_item_id=updated_work_item.id,
            description=f"Work item '{updated_work_item.title}' was updated.",
            metadata={"updated_fields": list(work_item_update.model_dump(exclude_unset=True))},
        )
        publish_event(
            "flow.work_item.updated",
            payload={
                "title": updated_work_item.title,
                "project_id": updated_work_item.project_id,
                "updated_fields": list(work_item_update.model_dump(exclude_unset=True)),
            },
            actor_user_id=updated_work_item.reporter_id,
            entity_type="work_item",
            entity_id=str(updated_work_item.id),
        )
        self._create_update_notifications(
            previous_status_id=previous_status_id,
            previous_priority_id=previous_priority_id,
            previous_assignee_id=previous_assignee_id,
            previous_due_date=previous_due_date,
            updated_work_item=updated_work_item,
            updated_fields=set(work_item_update.model_dump(exclude_unset=True)),
        )
        self._create_update_audit_events(
            previous_status_id=previous_status_id,
            previous_priority_id=previous_priority_id,
            previous_assignee_id=previous_assignee_id,
            previous_due_date=previous_due_date,
            previous_title=previous_title,
            previous_description=previous_description,
            updated_work_item=updated_work_item,
            updated_fields=set(work_item_update.model_dump(exclude_unset=True)),
        )
        self._execute_update_automation_rules(
            previous_status_id=previous_status_id,
            previous_priority_id=previous_priority_id,
            previous_assignee_id=previous_assignee_id,
            updated_work_item=updated_work_item,
            updated_fields=set(work_item_update.model_dump(exclude_unset=True)),
        )
        return updated_work_item

    def delete(self, work_item_id: int) -> None:
        work_item = self.get(work_item_id)
        self.work_item_repository.delete(work_item)
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="work_item",
                entity_id=str(work_item.id),
                action="work_item.archived",
                actor_id=work_item.reporter_id,
                old_value=work_item.title,
            )
        )

    def get_project_hierarchy(self, project_id: int) -> ProjectHierarchyRead:
        items = self.work_item_repository.list_by_project(project_id)
        nodes = {
            item.id: WorkItemHierarchyNode(
                id=item.id,
                project_id=item.project_id,
                parent_id=item.parent_id,
                item_level=item.item_level,
                title=item.title,
                status_id=item.status_id,
                priority_id=item.priority_id,
                children=[],
            )
            for item in items
        }
        roots: list[WorkItemHierarchyNode] = []
        for item in items:
            node = nodes[item.id]
            if item.parent_id and item.parent_id in nodes:
                nodes[item.parent_id].children.append(node)
            else:
                roots.append(node)
        level_order = {"initiative": 0, "feature": 1, "work_item": 2, "subtask": 3}
        roots.sort(key=lambda node: (level_order.get(node.item_level, 9), node.id))
        return ProjectHierarchyRead(project_id=project_id, items=roots)

    def create_subtask(self, work_item_id: int, subtask_create: WorkItemCreate) -> WorkItem:
        parent = self.get(work_item_id)
        payload = subtask_create.model_copy(
            update={
                "project_id": parent.project_id,
                "parent_id": parent.id,
                "item_level": "subtask",
            }
        )
        return self.create(payload)

    def update_parent(self, work_item_id: int, parent_update: WorkItemParentUpdate) -> WorkItem:
        work_item = self.get(work_item_id)
        return self.update(work_item_id, WorkItemUpdate(parent_id=parent_update.parent_id, item_level=work_item.item_level))

    def list_children(self, work_item_id: int) -> list[WorkItem]:
        self.get(work_item_id)
        return self.work_item_repository.list_children(work_item_id)

    def create_relation(self, work_item_id: int, relation_create: WorkItemRelationCreate):
        source = self.get(work_item_id)
        target = self.get(relation_create.target_work_item_id)
        if source.id == target.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Work item relation cannot target itself.")
        if source.project_id != target.project_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Related work must belong to the same project.")
        relation = self.work_item_repository.create_relation(work_item_id, relation_create)
        self.audit_service.record(
            AuditEventCreate(
                project_id=source.project_id,
                work_item_id=source.id,
                entity_type="relation",
                entity_id=str(relation.id),
                action="relation.added",
                actor_id=relation.created_by_id,
                new_value=f"{relation.relation_type}:{target.title}",
                metadata={"target_work_item_id": target.id, "relation_type": relation.relation_type},
            )
        )
        return relation

    def list_relations(self, work_item_id: int) -> list[WorkItemRelationRead]:
        self.get(work_item_id)
        results: list[WorkItemRelationRead] = []
        for relation in self.work_item_repository.list_relations(work_item_id):
            related = relation.target_work_item
            if relation.target_work_item_id == work_item_id:
                related = relation.source_work_item
            results.append(
                WorkItemRelationRead(
                    id=relation.id,
                    created_at=relation.created_at,
                    updated_at=relation.updated_at,
                    source_work_item_id=relation.source_work_item_id,
                    target_work_item_id=relation.target_work_item_id,
                    relation_type=relation.relation_type,
                    description=relation.description,
                    created_by_id=relation.created_by_id,
                    target_title=related.title if related else None,
                    target_status_id=related.status_id if related else None,
                    target_priority_id=related.priority_id if related else None,
                )
            )
        return results

    def delete_relation(self, work_item_id: int, relation_id: int) -> None:
        self.get(work_item_id)
        relation = self.work_item_repository.get_relation(relation_id)
        if relation is None or (
            relation.source_work_item_id != work_item_id and relation.target_work_item_id != work_item_id
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work item relation not found.")
        source = self.get(relation.source_work_item_id)
        related = self.get(relation.target_work_item_id)
        relation_type = relation.relation_type
        created_by_id = relation.created_by_id
        related_id = related.id
        related_title = related.title
        self.work_item_repository.delete_relation(relation)
        self.audit_service.record(
            AuditEventCreate(
                project_id=source.project_id,
                work_item_id=work_item_id,
                entity_type="relation",
                entity_id=str(relation_id),
                action="relation.removed",
                actor_id=created_by_id,
                old_value=f"{relation_type}:{related_title}",
                metadata={"target_work_item_id": related_id, "relation_type": relation_type},
            )
        )

    def create_link(self, work_item_id: int, link_create: LinkedEntityCreate):
        work_item = self.get(work_item_id)
        link = self.work_item_repository.create_link(work_item_id, link_create)
        self.activity_service.log_activity(
            action="link_added",
            entity_type="linked_entity",
            entity_id=str(link.id),
            project_id=work_item.project_id,
            work_item_id=work_item.id,
            description=f"Linked {link.entity_type} '{link.entity_title}' to work item '{work_item.title}'.",
            metadata={
                "entity_type": link.entity_type,
                "entity_id": link.entity_id,
                "entity_title": link.entity_title,
                "entity_url": link.entity_url,
            },
        )
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="linked_entity",
                entity_id=str(link.id),
                action="link.linked",
                new_value=link.entity_title,
                metadata={
                    "entity_type": link.entity_type,
                    "entity_id": link.entity_id,
                    "entity_title": link.entity_title,
                    "entity_url": link.entity_url,
                },
            )
        )
        return link

    def list_links(self, work_item_id: int) -> list[LinkedEntityRead]:
        self.get(work_item_id)
        return [LinkedEntityRead.model_validate(link) for link in self.work_item_repository.list_links(work_item_id)]

    def delete_link(self, work_item_id: int, link_id: int) -> None:
        work_item = self.get(work_item_id)
        link = self.work_item_repository.get_link(link_id)
        if link is None or link.work_item_id != work_item_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked entity not found.")
        metadata = {
            "entity_type": link.entity_type,
            "entity_id": link.entity_id,
            "entity_title": link.entity_title,
            "entity_url": link.entity_url,
        }
        entity_title = link.entity_title
        entity_type = link.entity_type
        self.work_item_repository.delete_link(link)
        self.activity_service.log_activity(
            action="link_removed",
            entity_type="linked_entity",
            entity_id=str(link_id),
            project_id=work_item.project_id,
            work_item_id=work_item.id,
            description=f"Removed {entity_type} '{entity_title}' from work item '{work_item.title}'.",
            metadata=metadata,
        )
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="linked_entity",
                entity_id=str(link_id),
                action="link.unlinked",
                old_value=entity_title,
                metadata=metadata,
            )
        )

    def ai_breakdown(self, work_item_id: int, request_id: str | None = None) -> WorkItemAIBreakdownRead:
        work_item = self.get(work_item_id)
        # TODO: Later tiers can optionally create actual subtasks from this response.
        prompt = (
            "Break this work item into implementation subtasks. Respond as JSON with keys: "
            "subtasks, acceptance_criteria, risks, dependencies, estimated_complexity.\n\n"
            f"Title: {work_item.title}\nDescription: {work_item.description or 'No description'}"
        )
        result = AIClient().complete(
            prompt,
            system_prompt="You are a pragmatic engineering lead. Return concise JSON only.",
            request_id=request_id,
        )
        return WorkItemAIBreakdownRead(
            work_item_id=work_item.id,
            subtasks=result.get("subtasks") or [],
            acceptance_criteria=result.get("acceptance_criteria") or [],
            risks=result.get("risks") or [],
            dependencies=result.get("dependencies") or [],
            estimated_complexity=result.get("estimated_complexity"),
            raw_response=result.get("raw_response"),
        )

    def prepare_memory_document(self, work_item_id: int) -> WorkItemMemoryDocumentPayload:
        work_item = self.get(work_item_id)
        # TODO: Resolve workspace_id from Core Service project membership when service-to-service lookup is available.
        return WorkItemMemoryDocumentPayload(
            external_reference=f"work_item:{work_item.id}",
            workspace_id=0,
            title=work_item.title,
            content=work_item.description or work_item.title,
            metadata={
                "work_item_id": work_item.id,
                "project_id": work_item.project_id,
                "type_id": work_item.type_id,
                "status_id": work_item.status_id,
                "priority_id": work_item.priority_id,
                "assignee_id": work_item.assignee_id,
                "reporter_id": work_item.reporter_id,
            },
        )

    def _apply_create_defaults(self, work_item_create: WorkItemCreate) -> WorkItemCreate:
        update_data: dict[str, int] = {}
        if work_item_create.type_id is None:
            update_data["type_id"] = self.work_item_repository.get_or_create_default_type().id
        if work_item_create.status_name:
            update_data["status_id"] = WorkflowService(self.work_item_repository.db).get_or_create_status_for_project(work_item_create.project_id, work_item_create.status_name).id
        elif work_item_create.status_id is None:
            update_data["status_id"] = WorkflowService(self.work_item_repository.db).get_or_create_status_for_project(work_item_create.project_id).id
        if work_item_create.priority_name:
            update_data["priority_id"] = self.work_item_repository.get_or_create_priority_by_name(work_item_create.priority_name).id
        elif work_item_create.priority_id is None:
            update_data["priority_id"] = self.work_item_repository.get_or_create_default_priority().id
        if work_item_create.reporter_id is None:
            # MVP fallback for unauthenticated UI creates and existing SQLite volumes
            # that were created before reporter_id became nullable.
            update_data["reporter_id"] = 0
        return work_item_create.model_copy(update=update_data)

    def _apply_update_lookup_names(self, work_item_update: WorkItemUpdate, project_id: int) -> WorkItemUpdate:
        update_data: dict[str, int] = {}
        if work_item_update.status_name:
            update_data["status_id"] = WorkflowService(self.work_item_repository.db).get_or_create_status_for_project(project_id, work_item_update.status_name).id
        if work_item_update.priority_name:
            update_data["priority_id"] = self.work_item_repository.get_or_create_priority_by_name(work_item_update.priority_name).id
        if not update_data:
            return work_item_update
        return work_item_update.model_copy(update=update_data)

    def _create_update_notifications(
        self,
        *,
        previous_status_id: int | None,
        previous_priority_id: int | None,
        previous_assignee_id: int | None,
        previous_due_date: object,
        updated_work_item: WorkItem,
        updated_fields: set[str],
    ) -> None:
        if "assignee_id" in updated_fields and previous_assignee_id != updated_work_item.assignee_id:
            self.notification_service.create_for_work_item(
                work_item=updated_work_item,
                notification_type="work_item_assigned",
                title="Work item assigned",
                message=f"'{updated_work_item.title}' was assigned.",
                user_id=updated_work_item.assignee_id,
            )
        if {"status_id", "status_name"} & updated_fields and previous_status_id != updated_work_item.status_id:
            self.notification_service.create_for_work_item(
                work_item=updated_work_item,
                notification_type="status_changed",
                title="Status changed",
                message=f"Status changed for '{updated_work_item.title}'.",
                user_id=updated_work_item.assignee_id,
            )
        if {"priority_id", "priority_name"} & updated_fields and previous_priority_id != updated_work_item.priority_id:
            self.notification_service.create_for_work_item(
                work_item=updated_work_item,
                notification_type="priority_changed",
                title="Priority changed",
                message=f"Priority changed for '{updated_work_item.title}'.",
                user_id=updated_work_item.assignee_id,
            )
        if "due_date" in updated_fields and previous_due_date != updated_work_item.due_date:
            self.notification_service.create_for_work_item(
                work_item=updated_work_item,
                notification_type="due_date_updated",
                title="Due date updated",
                message=f"Due date updated for '{updated_work_item.title}'.",
                user_id=updated_work_item.assignee_id,
            )

    def _create_update_audit_events(
        self,
        *,
        previous_status_id: int | None,
        previous_priority_id: int | None,
        previous_assignee_id: int | None,
        previous_due_date: object,
        previous_title: str | None,
        previous_description: str | None,
        updated_work_item: WorkItem,
        updated_fields: set[str],
    ) -> None:
        actor_id = updated_work_item.reporter_id
        if "title" in updated_fields and previous_title != updated_work_item.title:
            self._record_work_item_audit(updated_work_item, "work_item.updated", actor_id, previous_title, updated_work_item.title, {"field": "title"})
        if "description" in updated_fields and previous_description != updated_work_item.description:
            self._record_work_item_audit(updated_work_item, "work_item.updated", actor_id, previous_description, updated_work_item.description, {"field": "description"})
        if {"status_id", "status_name"} & updated_fields and previous_status_id != updated_work_item.status_id:
            self._record_work_item_audit(updated_work_item, "status.changed", actor_id, previous_status_id, updated_work_item.status_id, {"field": "status_id"})
        if {"priority_id", "priority_name"} & updated_fields and previous_priority_id != updated_work_item.priority_id:
            self._record_work_item_audit(updated_work_item, "priority.changed", actor_id, previous_priority_id, updated_work_item.priority_id, {"field": "priority_id"})
        if "assignee_id" in updated_fields and previous_assignee_id != updated_work_item.assignee_id:
            self._record_work_item_audit(updated_work_item, "assignee.changed", actor_id, previous_assignee_id, updated_work_item.assignee_id, {"field": "assignee_id"})
        if "due_date" in updated_fields and previous_due_date != updated_work_item.due_date:
            self._record_work_item_audit(updated_work_item, "due_date.updated", actor_id, previous_due_date, updated_work_item.due_date, {"field": "due_date"})

    def _record_work_item_audit(
        self,
        work_item: WorkItem,
        action: str,
        actor_id: int | None,
        old_value: object,
        new_value: object,
        metadata: dict | None = None,
    ) -> None:
        self.audit_service.record(
            AuditEventCreate(
                project_id=work_item.project_id,
                work_item_id=work_item.id,
                entity_type="work_item",
                entity_id=str(work_item.id),
                action=action,
                actor_id=actor_id,
                old_value=self._stringify_audit_value(old_value),
                new_value=self._stringify_audit_value(new_value),
                metadata=metadata,
            )
        )

    def _execute_update_automation_rules(
        self,
        *,
        previous_status_id: int | None,
        previous_priority_id: int | None,
        previous_assignee_id: int | None,
        updated_work_item: WorkItem,
        updated_fields: set[str],
    ) -> None:
        automation_service = AutomationRuleService(self.work_item_repository.db)
        if {"status_id", "status_name"} & updated_fields and previous_status_id != updated_work_item.status_id:
            automation_service.execute_for_event(
                "status_changed",
                updated_work_item,
                event_payload={"old_status_id": previous_status_id, "new_status_id": updated_work_item.status_id},
            )
        if {"priority_id", "priority_name"} & updated_fields and previous_priority_id != updated_work_item.priority_id:
            automation_service.execute_for_event(
                "priority_changed",
                updated_work_item,
                event_payload={"old_priority_id": previous_priority_id, "new_priority_id": updated_work_item.priority_id},
            )
        if "assignee_id" in updated_fields and previous_assignee_id != updated_work_item.assignee_id:
            automation_service.execute_for_event(
                "assignee_changed",
                updated_work_item,
                event_payload={"old_assignee_id": previous_assignee_id, "new_assignee_id": updated_work_item.assignee_id},
            )

    @staticmethod
    def _stringify_audit_value(value: object) -> str | None:
        if value is None:
            return None
        return str(value)

    def _validate_required_ids(self, project_id: int) -> None:
        if project_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id is required.",
            )

    def _validate_hierarchy(
        self,
        *,
        item_level: str,
        parent_id: int | None,
        project_id: int,
        work_item_id: int | None = None,
    ) -> None:
        if item_level == "initiative" and parent_id is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Initiatives cannot have parent work.")
        if item_level == "subtask" and parent_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subtasks must have parent work.")
        if parent_id is None:
            return
        if work_item_id is not None and parent_id == work_item_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Work item cannot be its own parent.")
        parent = self.work_item_repository.get_by_id(parent_id)
        if parent is None or not parent.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent work not found.")
        if parent.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent work must belong to the same project.")
        allowed_parent_levels = {
            "feature": {"initiative"},
            "work_item": {"initiative", "feature"},
            "subtask": {"work_item"},
        }
        if item_level in allowed_parent_levels and parent.item_level not in allowed_parent_levels[item_level]:
            allowed = ", ".join(sorted(allowed_parent_levels[item_level]))
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{item_level} parent must be one of: {allowed}.")

    def _validate_references(
        self,
        *,
        type_id: int | None,
        status_id: int | None,
        priority_id: int | None,
    ) -> None:
        if type_id is not None and not self.work_item_repository.type_exists(type_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item type not found.",
            )
        if status_id is not None and not self.work_item_repository.status_exists(status_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item status not found.",
            )
        if priority_id is not None and not self.work_item_repository.priority_exists(priority_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work item priority not found.",
            )

    def _validate_board_linkage(
        self,
        *,
        project_id: int,
        board_id: int | None,
        board_column_id: int | None,
    ) -> None:
        board = None
        if board_id is not None:
            board = self.work_item_repository.get_board(board_id)
            if board is None or not board.is_active:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
            if board.project_id != project_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Board must belong to the same project as the work item.",
                )

        if board_column_id is not None:
            board_column = self.work_item_repository.get_board_column(board_column_id)
            if board_column is None or not board_column.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Board column not found.",
                )
            if board_id is not None and board_column.board_id != board_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Board column must belong to the selected board.",
                )
            if board_id is None and board_column.board.project_id != project_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Board column must belong to a board in the work item's project.",
                )
