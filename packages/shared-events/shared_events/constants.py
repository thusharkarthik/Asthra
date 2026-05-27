class EventNames:
    CORE_ORGANIZATION_CREATED = "core.organization.created"
    CORE_WORKSPACE_CREATED = "core.workspace.created"
    FLOW_WORK_ITEM_CREATED = "flow.work_item.created"
    DOCS_PAGE_UPDATED = "docs.page.updated"
    AI_COMPLETION_GENERATED = "ai.completion.generated"
    MEMORY_DOCUMENT_CHUNKED = "memory.document.chunked"
    AUTOMATION_WORKFLOW_EXECUTED = "automation.workflow.executed"


COMMON_EVENT_NAMES = {
    EventNames.CORE_ORGANIZATION_CREATED,
    EventNames.CORE_WORKSPACE_CREATED,
    EventNames.FLOW_WORK_ITEM_CREATED,
    EventNames.DOCS_PAGE_UPDATED,
    EventNames.AI_COMPLETION_GENERATED,
    EventNames.MEMORY_DOCUMENT_CHUNKED,
    EventNames.AUTOMATION_WORKFLOW_EXECUTED,
}
